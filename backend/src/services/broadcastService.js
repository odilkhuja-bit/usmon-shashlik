// ============================================
// USMON SHASHLIK — Broadcast Service
// ============================================

const { PrismaClient } = require('@prisma/client');
const { sendMessage, sendPhoto } = require('./telegramService');
const config = require('../config/default');
const logger = require('../utils/logger');

const prisma = new PrismaClient();

/**
 * Start sending broadcast in batches
 */
async function startBroadcast(broadcastId, io) {
  const broadcast = await prisma.broadcast.findUnique({ where: { id: broadcastId } });
  if (!broadcast) return;

  // Get target users
  let userFilter = { isBlocked: false };

  if (broadcast.targetFilter) {
    try {
      const filter = JSON.parse(broadcast.targetFilter);
      if (filter.type === 'active') {
        // Active users — ordered at least once
        const activeUserIds = await prisma.order.findMany({
          select: { userId: true },
          distinct: ['userId'],
        });
        userFilter.id = { in: activeUserIds.map((u) => u.userId) };
      } else if (filter.type === 'recent30') {
        // Ordered in last 30 days
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        const recentUserIds = await prisma.order.findMany({
          where: { createdAt: { gte: thirtyDaysAgo } },
          select: { userId: true },
          distinct: ['userId'],
        });
        userFilter.id = { in: recentUserIds.map((u) => u.userId) };
      } else if (filter.type === 'branch' && filter.branchId) {
        userFilter.selectedBranchId = filter.branchId;
      } else if (filter.type === 'inactive') {
        // Users with zero orders
        const orderedUserIds = await prisma.order.findMany({
          select: { userId: true },
          distinct: ['userId'],
        });
        userFilter.id = { notIn: orderedUserIds.map((u) => u.userId) };
      }
    } catch (e) {
      logger.error('Invalid broadcast filter:', e.message);
    }
  }

  const users = await prisma.user.findMany({ where: userFilter });

  // Update broadcast with total count
  await prisma.broadcast.update({
    where: { id: broadcastId },
    data: {
      totalUsers: users.length,
      status: 'SENDING',
    },
  });

  // Create broadcast logs
  await prisma.broadcastLog.createMany({
    data: users.map((user) => ({
      broadcastId,
      userId: user.id,
      status: 'pending',
    })),
  });

  logger.info(`Broadcast ${broadcastId} started for ${users.length} users`);

  // Send in batches
  const batchSize = config.broadcast.batchSize;
  const delayMs = config.broadcast.delayMs;
  let sentCount = 0;
  let failedCount = 0;

  for (let i = 0; i < users.length; i += batchSize) {
    const batch = users.slice(i, i + batchSize);

    await Promise.all(
      batch.map(async (user) => {
        try {
          let result;
          const chatId = user.telegramId.toString();

          const options = {};
          if (broadcast.buttonText && broadcast.buttonUrl) {
            options.reply_markup = {
              inline_keyboard: [[{ text: broadcast.buttonText, url: broadcast.buttonUrl }]],
            };
          }

          if (broadcast.imageUrl) {
            result = await sendPhoto(chatId, broadcast.imageUrl, broadcast.message, options);
          } else {
            result = await sendMessage(chatId, broadcast.message, options);
          }

          if (result && result.blocked) {
            failedCount++;
            await prisma.broadcastLog.updateMany({
              where: { broadcastId, userId: user.id },
              data: { status: 'failed', error: 'User blocked the bot', sentAt: new Date() },
            });
            // Mark user as blocked
            await prisma.user.update({ where: { id: user.id }, data: { isBlocked: true } });
          } else if (result) {
            sentCount++;
            await prisma.broadcastLog.updateMany({
              where: { broadcastId, userId: user.id },
              data: { status: 'sent', sentAt: new Date() },
            });
          } else {
            failedCount++;
            await prisma.broadcastLog.updateMany({
              where: { broadcastId, userId: user.id },
              data: { status: 'failed', error: 'Send failed', sentAt: new Date() },
            });
          }
        } catch (err) {
          failedCount++;
          await prisma.broadcastLog.updateMany({
            where: { broadcastId, userId: user.id },
            data: { status: 'failed', error: err.message, sentAt: new Date() },
          });
        }
      })
    );

    // Update progress
    await prisma.broadcast.update({
      where: { id: broadcastId },
      data: { sentCount, failedCount },
    });

    // Emit progress to admin
    if (io) {
      io.to('admins').emit('broadcast-progress', {
        broadcastId,
        sentCount,
        failedCount,
        totalUsers: users.length,
        pending: users.length - sentCount - failedCount,
      });
    }

    // Rate limit delay between batches
    if (i + batchSize < users.length) {
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }

  // Mark broadcast as completed
  await prisma.broadcast.update({
    where: { id: broadcastId },
    data: {
      status: 'COMPLETED',
      sentCount,
      failedCount,
      completedAt: new Date(),
    },
  });

  logger.info(`Broadcast ${broadcastId} completed: sent=${sentCount}, failed=${failedCount}`);

  if (io) {
    io.to('admins').emit('broadcast-completed', {
      broadcastId,
      sentCount,
      failedCount,
      totalUsers: users.length,
    });
  }
}

module.exports = {
  startBroadcast,
};

import AuditLog from "@/models/AuditLogs";
import connectDB from "@/lib/mongodb";

export const logAction = async (userId: string, action: string, entity: string, entityId?: string, details?: Record<string, any>) => {
    await connectDB();
    try {
        await AuditLog.create({ userId, action, entity, entityId, details });
    } catch (error) {
        console.error("Error logging action:", error);
    }
};

export const getAuditLogs = async (filters: any) => {
    await connectDB();
    const { userId, action, entity, startDate, endDate, page = 1, limit = 10 } = filters;

    const query: any = {};
    if (userId) query.userId = userId;
    if (action) query.action = action;
    if (entity) query.entity = entity;
    if (startDate && endDate) {
        query.timestamp = { $gte: new Date(startDate), $lte: new Date(endDate) };
    }

    const logs = await AuditLog.find(query)
        .sort({ timestamp: -1 })
        .skip((page - 1) * limit)
        .limit(limit);

    const totalLogs = await AuditLog.countDocuments(query);
    return { data: logs, total: totalLogs, page, limit };
};

export const deleteOldLogs = async (days: number) => {
    await connectDB();
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    await AuditLog.deleteMany({ timestamp: { $lte: cutoffDate } });
    return { message: `Deleted logs older than ${days} days.` };
};

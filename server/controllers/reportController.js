import { query, get } from '../database/db.js';

// ────────────────────────────────────────────────────────────────────
// Profit & Loss Report
// ────────────────────────────────────────────────────────────────────

export const getProfitLossReport = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    let dateWhere = '';
    let dateParams = [];
    if (startDate && endDate) {
      dateWhere = `WHERE date(s.saleDate) BETWEEN date(?) AND date(?)`;
      dateParams = [startDate, endDate];
    } else if (startDate) {
      dateWhere = `WHERE date(s.saleDate) >= date(?)`;
      dateParams = [startDate];
    } else if (endDate) {
      dateWhere = `WHERE date(s.saleDate) <= date(?)`;
      dateParams = [endDate];
    }

    // ── Summary totals ──
    const revenueRow = await get(
      `SELECT COALESCE(SUM(s.grandTotal), 0) as revenue,
              COUNT(DISTINCT s.id) as totalSales
       FROM sales s ${dateWhere}`,
      dateParams
    );

    const cogsRow = await get(
      `SELECT COALESCE(SUM(COALESCE(si.costPrice, p.costPrice, 0) * si.qty), 0) as cogs
       FROM sale_items si
       JOIN sales s ON si.saleId = s.id
       LEFT JOIN products p ON si.productId = p.id
       ${dateWhere}`,
      dateParams
    );

    const totalItemsSold = await get(
      `SELECT COALESCE(SUM(si.qty), 0) as qty
       FROM sale_items si
       JOIN sales s ON si.saleId = s.id
       ${dateWhere}`,
      dateParams
    );

    const revenue = revenueRow.revenue || 0;
    const cogs = cogsRow.cogs || 0;
    const grossProfit = revenue - cogs;
    const profitMargin = revenue > 0 ? ((grossProfit / revenue) * 100) : 0;

    // ── Profit by product ──
    const byProduct = await query(
      `SELECT
         si.productName,
         COALESCE(si.costPrice, p.costPrice, 0) as costPrice,
         SUM(si.qty)                          as qtySold,
         SUM(si.total)                        as revenue,
         SUM(COALESCE(si.costPrice, p.costPrice, 0) * si.qty) as cost,
         SUM(si.total) - SUM(COALESCE(si.costPrice, p.costPrice, 0) * si.qty) as profit
       FROM sale_items si
       JOIN sales s ON si.saleId = s.id
       LEFT JOIN products p ON si.productId = p.id
       ${dateWhere}
       GROUP BY si.productId, si.productName
       ORDER BY profit DESC`,
      dateParams
    );

    // ── Profit by category ──
    const byCategory = await query(
      `SELECT
         COALESCE(p.category, 'Uncategorized') as category,
         SUM(si.qty)                          as qtySold,
         SUM(si.total)                        as revenue,
         SUM(COALESCE(si.costPrice, p.costPrice, 0) * si.qty) as cost,
         SUM(si.total) - SUM(COALESCE(si.costPrice, p.costPrice, 0) * si.qty) as profit
       FROM sale_items si
       JOIN sales s ON si.saleId = s.id
       LEFT JOIN products p ON si.productId = p.id
       ${dateWhere}
       GROUP BY p.category
       ORDER BY profit DESC`,
      dateParams
    );

    // ── Daily trend (last 30 days or within range) ──
    const dailyTrend = await query(
      `SELECT
         date(s.saleDate) as date,
         SUM(si.total)                        as revenue,
         SUM(COALESCE(si.costPrice, p.costPrice, 0) * si.qty) as cost,
         SUM(si.total) - SUM(COALESCE(si.costPrice, p.costPrice, 0) * si.qty) as profit
       FROM sale_items si
       JOIN sales s ON si.saleId = s.id
       LEFT JOIN products p ON si.productId = p.id
       ${dateWhere || 'WHERE date(s.saleDate) >= date("now", "-30 days")'}
       GROUP BY date(s.saleDate)
       ORDER BY date(s.saleDate) ASC`,
      dateParams.length > 0 ? dateParams : []
    );

    // ── Monthly trend ──
    const monthlyTrend = await query(
      `SELECT
         strftime('%Y-%m', s.saleDate) as month,
         SUM(si.total)                        as revenue,
         SUM(COALESCE(si.costPrice, p.costPrice, 0) * si.qty) as cost,
         SUM(si.total) - SUM(COALESCE(si.costPrice, p.costPrice, 0) * si.qty) as profit
       FROM sale_items si
       JOIN sales s ON si.saleId = s.id
       LEFT JOIN products p ON si.productId = p.id
       ${dateWhere}
       GROUP BY strftime('%Y-%m', s.saleDate)
       ORDER BY month ASC`,
      dateParams
    );

    // ── Top profitable products (top 5) ──
    const topProducts = await query(
      `SELECT
         si.productName,
         SUM(si.total) - SUM(COALESCE(si.costPrice, p.costPrice, 0) * si.qty) as profit,
         SUM(si.qty) as qtySold
       FROM sale_items si
       JOIN sales s ON si.saleId = s.id
       LEFT JOIN products p ON si.productId = p.id
       ${dateWhere}
       GROUP BY si.productId, si.productName
       ORDER BY profit DESC
       LIMIT 5`,
      dateParams
    );

    // ── Loss-making products ──
    const lossProducts = await query(
      `SELECT
         si.productName,
         SUM(si.total) - SUM(COALESCE(si.costPrice, p.costPrice, 0) * si.qty) as profit,
         SUM(si.qty) as qtySold
       FROM sale_items si
       JOIN sales s ON si.saleId = s.id
       LEFT JOIN products p ON si.productId = p.id
       ${dateWhere}
       GROUP BY si.productId, si.productName
       HAVING profit < 0
       ORDER BY profit ASC`,
      dateParams
    );

    res.json({
      summary: {
        revenue,
        cogs,
        grossProfit,
        profitMargin,
        totalSales: revenueRow.totalSales || 0,
        totalItemsSold: totalItemsSold.qty || 0,
      },
      byProduct,
      byCategory,
      dailyTrend,
      monthlyTrend,
      topProducts,
      lossProducts,
    });
  } catch (error) {
    console.error('P&L report error:', error);
    res.status(500).json({ message: 'Error generating profit & loss report' });
  }
};


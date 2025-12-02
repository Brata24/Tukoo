import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { db } from '$lib/server/db';
import { merchant, product, order, orderItem, category } from '$lib/server/db/schema';
import { eq, and, sql, gte, lte, desc } from 'drizzle-orm';

export const POST: RequestHandler = async ({ request, locals, params }) => {
	if (!locals.sessionPos || !locals.userPos) {
		throw error(401, 'Unauthorized');
	}

	const merchantData = await db.query.merchant.findFirst({
		where: eq(merchant.slug, params.slug)
	});

	if (!merchantData) {
		throw error(404, 'Merchant not found');
	}

	if (locals.userPos.merchantId !== merchantData.id) {
		throw error(403, 'Forbidden');
	}

	const { month, year } = await request.json();

	// Calculate date range
	const startDate = new Date(year, month - 1, 1);
	startDate.setHours(0, 0, 0, 0);
	
	const endDate = new Date(year, month, 0);
	endDate.setHours(23, 59, 59, 999);

	// Get sales report data
	const salesReport = await db
		.select({
			productName: product.name,
			categoryName: sql<string>`COALESCE(${category.name}, 'Uncategorized')`,
			totalQuantity: sql<number>`SUM(${orderItem.quantity})`,
			totalRevenue: sql<number>`SUM(${orderItem.subtotal})`,
			orderCount: sql<number>`COUNT(DISTINCT ${order.id})`
		})
		.from(orderItem)
		.innerJoin(product, eq(orderItem.productId, product.id))
		.innerJoin(order, eq(orderItem.orderId, order.id))
		.leftJoin(category, eq(product.categoryId, category.id))
		.where(
			and(
				eq(product.merchantId, merchantData.id),
				eq(order.status, 'paid'),
				gte(order.createdAt, startDate),
				lte(order.createdAt, endDate)
			)
		)
		.groupBy(
			product.id,
			product.name,
			category.name
		)
		.orderBy(desc(sql<number>`SUM(${orderItem.subtotal})`));

	// Get summary
	const summary = await db
		.select({
			totalRevenue: sql<number>`COALESCE(SUM(${order.total}), 0)`,
			totalOrders: sql<number>`COUNT(DISTINCT ${order.id})`,
			totalItems: sql<number>`COALESCE(SUM(${orderItem.quantity}), 0)`
		})
		.from(order)
		.leftJoin(orderItem, eq(orderItem.orderId, order.id))
		.where(
			and(
				eq(order.merchantId, merchantData.id),
				eq(order.status, 'paid'),
				gte(order.createdAt, startDate),
				lte(order.createdAt, endDate)
			)
		);

	const formatCurrency = (amount: number): string => {
		return new Intl.NumberFormat('id-ID', {
			style: 'currency',
			currency: 'IDR',
			minimumFractionDigits: 0,
			maximumFractionDigits: 0
		}).format(amount);
	};

	const months = [
		'', 'January', 'February', 'March', 'April', 'May', 'June',
		'July', 'August', 'September', 'October', 'November', 'December'
	];
	const monthName = months[month];

	// Create PDF
	const doc = new jsPDF({
		orientation: 'landscape',
		unit: 'mm',
		format: 'a4'
	});

	// Add header
	doc.setFontSize(18);
	doc.setFont('helvetica', 'bold');
	doc.text(merchantData.name, 14, 15);
	
	doc.setFontSize(14);
	doc.text(`Sales Report - ${monthName} ${year}`, 14, 25);
	
	doc.setFontSize(10);
	doc.setFont('helvetica', 'italic');
	doc.text(`Generated: ${new Date().toLocaleDateString('id-ID')}`, 14, 32);

	// Prepare table data
	const tableData: any[] = salesReport.map((item, index) => [
		String(index + 1),
		item.productName,
		item.categoryName,
		String(Number(item.totalQuantity)),
		formatCurrency(Number(item.totalRevenue)),
		String(Number(item.orderCount))
	]);

	// Add summary row
	tableData.push([
		{ content: 'TOTAL', colSpan: 3, styles: { fontStyle: 'bold', halign: 'right' } },
		{ content: String(Number(summary[0]?.totalItems || 0)), styles: { fontStyle: 'bold' } },
		{ content: formatCurrency(Number(summary[0]?.totalRevenue || 0)), styles: { fontStyle: 'bold' } },
		{ content: String(Number(summary[0]?.totalOrders || 0)), styles: { fontStyle: 'bold' } }
	] as any);

	// Add table
	autoTable(doc, {
		startY: 40,
		head: [['No', 'Product Name', 'Category', 'Qty Sold', 'Total Revenue', 'Orders']],
		body: tableData,
		theme: 'grid',
		styles: {
			fontSize: 9,
			cellPadding: 3
		},
		headStyles: {
			fillColor: [243, 244, 246],
			textColor: [31, 41, 55],
			fontStyle: 'bold',
			halign: 'left'
		},
		columnStyles: {
			0: { halign: 'center', cellWidth: 15 },
			1: { halign: 'left' },
			2: { halign: 'left', cellWidth: 30 },
			3: { halign: 'right', cellWidth: 25 },
			4: { halign: 'right', cellWidth: 40 },
			5: { halign: 'right', cellWidth: 25 }
		}
	});

	// Get PDF as base64
	const pdfBase64 = doc.output('datauristring').split(',')[1];

	return json({
		success: true,
		pdf: pdfBase64,
		filename: `Sales_Report_${monthName}_${year}.pdf`
	});
};

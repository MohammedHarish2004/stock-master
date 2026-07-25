import { useState } from "react";
import { FileSpreadsheet, Loader2 } from "lucide-react";
import { toast } from "react-hot-toast";

const ExcelExport = () => {
  const [exporting, setExporting] = useState(false);

  const exportToExcel = async () => {
    setExporting(true);

    try {
      const res = await fetch("/api/products");

      if (!res.ok) {
        throw new Error("Failed to fetch products");
      }

      const products = await res.json();

      if (!products.length) {
        toast("No products to export");
        return;
      }

      const headers = [
        "No",
        "Product Name",
        "Category",
        "Brand",
        "Cost Price",
        "Default Selling Price",
        "Stock Quantity",
      ];

      const rows = products.map((product, index) => [
        index + 1,
        product.productName || "-",
        product.category || "-",
        product.brand || "-",
        product.costPrice ?? 0,
        product.defaultSellingPrice ?? 0,
        product.stockQty ?? 0,
      ]);

      const escapeCell = (value) => {
        const str = String(value ?? "");
        if (/[",\n]/.test(str)) {
          return `"${str.replace(/"/g, '""')}"`;
        }
        return str;
      };

      const csv = [
        headers.map(escapeCell).join(","),
        ...rows.map((row) => row.map(escapeCell).join(",")),
      ].join("\r\n");

      const blob = new Blob(["\uFEFF" + csv], {
        type: "text/csv;charset=utf-8;",
      });

      const url = URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = url;
      link.download = `products-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      URL.revokeObjectURL(url);

      toast.success(`Exported ${products.length} products`);
    } catch (err) {
      console.error(err);
      toast.error(err.message);
    } finally {
      setExporting(false);
    }
  };

  return (
    <button
      onClick={exportToExcel}
      disabled={exporting}
      className="flex float-end items-center gap-2 px-5 m-4 py-2.5 text-sm font-bold text-green-700 bg-green-50 hover:bg-green-100 border border-green-200 rounded-xl transition-all disabled:opacity-50 shadow-sm"
    >
      {exporting ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <FileSpreadsheet className="w-4 h-4" />
      )}

      {exporting ? "Exporting..." : "Export Excel"}
    </button>
  );
};

export default ExcelExport;

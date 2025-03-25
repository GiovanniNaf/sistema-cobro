"use client"; // Agrega esto al principio
import { useState, useEffect } from 'react';
import { supabase } from '/lib/supabase';
import { jsPDF } from "jspdf";
import { TextAlignment } from 'pdf-lib';
import autoTable from 'jspdf-autotable';

const Home = () => {
  const [cobros, setCobros] = useState([]);
  const [formData, setFormData] = useState({
    cliente: '',
    cantidad: '',
    concepto: '',
    recibo: '',
  });

  const [reporteFechas, setReporteFechas] = useState({
    fechaInicio: '',
    fechaFin: ''
  });
  // Cargar los cobros desde la base de datos
  const fetchCobros = async () => {
    const { data, error } = await supabase
      .from('cobros')
      .select('*')
      .order('fecha', { ascending: false });

    if (error) {
      console.error('Error al obtener los cobros:', error);
    } else {
      setCobros(data);
    }
  };

  useEffect(() => {
    fetchCobros();
  }, []);

  // Manejar la generación del reporte en formato ticket
  const handleShowReport = async (id) => {
    try {
      // Obtener el cobro con el id específico
      const { data: cobro, error: cobroError } = await supabase
        .from('cobros')
        .select('*')
        .eq('id', id)
        .single();

      if (cobroError) {
        console.error('Error al obtener el cobro:', cobroError);
        return;
      }

      // Crear el PDF como un ticket
      const doc = new jsPDF({
        unit: "mm",
        format: [57, 200], // Tamaño típico de un ticket (80mm de ancho por 160mm de alto)
      });

      doc.setFont("Arial", "bold");
      doc.setFontSize(10);
      doc.setTextColor(0, 0, 0);
      doc.text("UNIDOS PARA SIEMPRE", 23, 10, { align: "center" });
      
      doc.setFont("Arial", "normal");
      doc.setFontSize(9);
      doc.text("TEL: 968-688-1594", 23, 15, { align: "center" });
      doc.text("Libramiento Pte. Nte. #13", 23, 20, { align: "center" });
      doc.text("Ocozocoautla de Espinoza, Chis.", 23, 25, { align: "center" });
      doc.text("www.unidosparasiempre.org", 23, 30, { align: "center" });
      
      doc.text("-------------------------------------------------------------", 28, 35, { align: "center" });
      
      doc.text(`Fecha: ${new Date(cobro.fecha).toLocaleDateString()}`, 22, 40, { align: "center" });
      doc.text("Caja Nro: 1", 22, 45, { align: "center" });
      doc.text("Cajero: Eduardo Ivan", 22, 50, { align: "center" });
      
      doc.setFont("Arial", "bold");
      doc.setFontSize(10);
      doc.text(`TICKET NRO.: F00UPS0${cobro.recibo}`, 23, 55, { align: "center" });
      
      doc.setFont("Arial", "normal");
      doc.setFontSize(9);
      doc.text("------------------------------------------------------", 28, 60, { align: "center" });
      
      doc.text(`Recibí de`, 22, 65, { align: "center" });
      doc.setFont("Arial", "bold");
      doc.setFontSize(10);
      doc.text(`${cobro.cliente}`, 23, 70, { align: "center" });
     
      doc.setFont("Arial", "normal");
      doc.setFontSize(10);
      doc.text("------------------------------------------------------", 28, 75, { align: "center" });
      
      doc.text("La cantidad de", 23, 80, { align: "center" });
      doc.setFont("Arial", "bold");
      doc.setFontSize(10);
      doc.text(`$${parseFloat(cobro.cantidad).toFixed(2)} MXN`, 23, 85, { align: "center" });
      doc.text("------------------------------------------------------", 28, 90, { align: "center" });
      
      doc.setFont("Arial", "normal");
      doc.setFontSize(10);
      doc.text("Por Concepto de", 23, 95, { align: "center" });
      doc.setFont("Arial", "bold");
      doc.setFontSize(10);
      doc.text(`${cobro.concepto}`, 23, 100, { align: "center" });
      
      doc.text("------------------------------------------------------", 28, 105, { align: "center" });
      
     
      doc.text(`TOTAL PAGADO`, 23, 115, { align: "center" });
      doc.text(`$${parseFloat(cobro.cantidad).toFixed(2)} MXN`, 23, 120, { align: "center" });


      doc.text("FIRMA Y SELLO", 23, 130, { align: "center" });
      doc.text("--------------------------", 23, 140, { align: "center" });
      
      doc.text("*Para poder realizar una ", 23, 150, { align: "center" });
      doc.text("aclaración debe ", 23, 155, { align: "center" });
      doc.text("presentar este ticket*", 23, 160, { align: "center" });
      
      doc.setFont("Arial", "bold");
      doc.text("Gracias por su pago", 23, 170, { align: "center" });
      

      // Mostrar PDF
      const pdfBlob = doc.output("blob");
      const pdfUrl = URL.createObjectURL(pdfBlob);
      window.open(pdfUrl, "_blank");

    } catch (error) {
      console.error('Error al generar el reporte:', error);
    }
  };


const handleDeleteCobro = async (id) => {
  try {
    const { error } = await supabase
      .from('cobros')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error al eliminar el cobro:', error);
    } else {
      // Actualizar la lista de cobros después de eliminar
      fetchCobros();
    }
  } catch (error) {
    console.error('Error al eliminar el cobro:', error);
  }
};

const generarReportePorFechas = async () => {
  try {
    const { fechaInicio, fechaFin } = reporteFechas;
    
    if (!fechaInicio || !fechaFin) {
      alert('Por favor selecciona ambas fechas');
      return;
    }

    const { data: cobrosFiltrados, error } = await supabase
      .from('cobros')
      .select('*')
      .gte('fecha', fechaInicio)
      .lte('fecha', fechaFin)
      .order('fecha', { ascending: true });

    if (error) {
      console.error('Error al obtener cobros:', error);
      return;
    }

    if (cobrosFiltrados.length === 0) {
      alert('No hay cobros en el rango de fechas seleccionado');
      return;
    }

    // Calcular total
    const total = cobrosFiltrados.reduce((sum, cobro) => sum + parseFloat(cobro.cantidad), 0);

    // Crear PDF en tamaño carta (letter)
    const doc = new jsPDF({
      unit: 'mm',
      format: 'letter',
      orientation: 'portrait' // Vertical
    });

    // Logo y encabezado
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.setTextColor(40, 53, 147); // Azul oscuro
    doc.text("UNIDOS PARA SIEMPRE", 105, 20, { align: "center" });
    
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.text("Reporte de Cobros por Fechas", 105, 30, { align: "center" });
    
    doc.setFontSize(10);
    doc.text(`Desde: ${new Date(fechaInicio).toLocaleDateString()} - Hasta: ${new Date(fechaFin).toLocaleDateString()}`, 
      105, 38, { align: "center" });
    
    // Configuración de columnas
    const columns = [
      { header: "Fecha", dataKey: "fecha", width: 25 },
      { header: "Ticket No.", dataKey: "recibo", width: 30 },
      { header: "Cliente", dataKey: "cliente", width: 50 },
      { header: "Concepto", dataKey: "concepto", width: 50 },
      { header: "Cantidad", dataKey: "cantidad", width: 25 }
    ];
    
    // Preparar datos
    const body = cobrosFiltrados.map(cobro => ({
      fecha: new Date(cobro.fecha).toLocaleDateString(),
      recibo: `F00UPS0${(cobro.recibo)}`|| 'N/A',
      cliente: cobro.cliente,
      concepto: cobro.concepto,
      cantidad: `$${parseFloat(cobro.cantidad).toFixed(2)}`
    }));

    

    // Generar tabla
    autoTable(doc, {
      columns: columns,
      body: body,
      startY: 45,
      margin: { left: 15, right: 15 },
      headStyles: {
        fillColor: [40, 53, 147],
        textColor: 255,
        fontStyle: 'bold',
        fontSize: 10
      },
      bodyStyles: {
        fontSize: 9,
        cellPadding: 3,
        textColor: [0, 0, 0]
      },
      alternateRowStyles: {
        fillColor: [240, 240, 240]
      },
      columnStyles: {
        cantidad: { halign: 'right' }
      },
      styles: {
        overflow: 'linebreak',
        lineWidth: 0.1
      },
     
      // Asegurar que el total siempre tenga espacio
      didDrawPage: function(data) {
        // Si estamos en la última página o la tabla no llena toda la página
        if (data.pageCount === data.pageNumber || data.cursor.y < 250) {
          const finalY = Math.max(data.cursor.y, 250) + 10;
          
          // Línea divisoria
          doc.setDrawColor(150);
          doc.setLineWidth(0.3);
          doc.line(120, finalY, 200, finalY);
          
          // Total
          doc.setFontSize(11);
          doc.setFont("helvetica", "bold");
          doc.text("Total:", 150, finalY + 8, { align: "right" });
          doc.text(`$${total.toFixed(2)}`, 200 - 15, finalY + 8, { align: "right" });
        } else {
          // Si no hay espacio, agregar nueva página para el total
          doc.addPage();
          doc.setPage(data.pageCount + 1);
          
          // Total en nueva página
          doc.setFontSize(11);
          doc.setFont("helvetica", "bold");
          doc.text("Total:", 150, 30, { align: "right" });
          doc.text(`$${total.toFixed(2)}`, 200 - 15, 30, { align: "right" });
        }
        
        // Pie de página en todas las páginas
        doc.setFontSize(8);
        doc.setTextColor(100);
        doc.text(`Generado el: ${new Date().toLocaleDateString()}`, 15, 
        doc.internal.pageSize.height - 10);
      
      }
    });

    // Guardar PDF
    const pdfBlob = doc.output("blob");
    const pdfUrl = URL.createObjectURL(pdfBlob);
    window.open(pdfUrl, "_blank");

  } catch (error) {
    console.error('Error al generar reporte:', error);
    alert('Ocurrió un error al generar el reporte');
  }
};


  return (
    <div className="p-8">
    <h1 className="text-3xl font-semibold text-center mb-8">Sistema de Cobro</h1>

    {/* Sección de reporte por fechas */}
    <div className="bg-white p-6 rounded-lg shadow-md mb-8">
      <h2 className="text-2xl font-medium mb-4">Reporte por Fechas</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Fecha Inicio</label>
          <input
            type="date"
            value={reporteFechas.fechaInicio}
            onChange={(e) => setReporteFechas({...reporteFechas, fechaInicio: e.target.value})}
            className="w-full p-2 border border-gray-300 rounded-md"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Fecha Fin</label>
          <input
            type="date"
            value={reporteFechas.fechaFin}
            onChange={(e) => setReporteFechas({...reporteFechas, fechaFin: e.target.value})}
            className="w-full p-2 border border-gray-300 rounded-md"
          />
        </div>
        <div className="flex items-end">
          <button
            onClick={generarReportePorFechas}
            className="w-full py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
          >
            Generar Reporte
          </button>
        </div>
      </div>
    </div>
  
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Panel izquierdo - Registrar nuevo cobro */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-2xl font-medium mb-4">Registrar nuevo cobro</h2>
          <form onSubmit={async (e) => {
            e.preventDefault();
            const { cliente, cantidad, concepto } = formData;
  
            // Insertar el nuevo cobro en la base de datos
            const { data, error } = await supabase
              .from('cobros')
              .insert([{ cliente, cantidad, concepto }]);
  
            if (error) {
              console.error('Error al registrar el cobro:', error);
            } else {
              setFormData({ cliente: '', cantidad: '', concepto: '' });
              fetchCobros(); // Recargar cobros después de agregar uno nuevo
            }
          }} className="space-y-6">
            <div>
              <label htmlFor="cliente" className="block text-sm font-medium">Cliente</label>
              <input
                type="text"
                id="cliente"
                value={formData.cliente}
                onChange={(e) =>
                  setFormData({ ...formData, cliente: e.target.value })
                }
                className="w-full p-2 border border-gray-300 rounded-md"
                required
              />
            </div>
            <div>
              <label htmlFor="cantidad" className="block text-sm font-medium">Cantidad</label>
              <input
                type="number"
                id="cantidad"
                value={formData.cantidad}
                onChange={(e) =>
                  setFormData({ ...formData, cantidad: e.target.value })
                }
                className="w-full p-2 border border-gray-300 rounded-md"
                required
              />
            </div>
            <div>
              <label htmlFor="concepto" className="block text-sm font-medium">Concepto</label>
              <input
                type="text"
                id="concepto"
                value={formData.concepto}
                onChange={(e) =>
                  setFormData({ ...formData, concepto: e.target.value })
                }
                className="w-full p-2 border border-gray-300 rounded-md"
                required
              />
            </div>
            <button
              type="submit"
              className="w-full py-2 mt-4 bg-blue-500 text-white rounded-md hover:bg-blue-600"
            >
              Registrar cobro
            </button>
          </form>
        </div>
  
       {/* Panel derecho - Cobros recientes */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-2xl font-medium mb-4">Cobros recientes</h2>
        <ul className="space-y-4 max-h-[600px] overflow-y-auto">
          {cobros.map((cobro) => (
            <li key={cobro.id} className="p-4 border border-gray-300 rounded-md">
              <div className="flex justify-between">
                <span className="font-semibold">{cobro.cliente}</span>
                <span className='text-green-700 font-bold'>${cobro.cantidad}</span>
              </div>
              <p>{cobro.concepto}</p>
              <p className="text-sm text-gray-500">{new Date(cobro.fecha).toLocaleString()}</p>
              <div className="flex justify-end space-x-2 mt-2">
                <button
                  onClick={() => handleShowReport(cobro.id)}
                  className="px-3 py-1 bg-blue-500 text-white rounded-md hover:bg-blue-600 text-sm"
                >
                  Ver Ticket
                </button>
                <button
                  onClick={() => handleDeleteCobro(cobro.id)}
                  className="px-3 py-1 bg-red-500 text-white rounded-md hover:bg-red-600 text-sm"
                >
                  Eliminar
                </button>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  </div>

  
);
      
}
export default Home;

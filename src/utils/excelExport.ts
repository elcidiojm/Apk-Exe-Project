import * as XLSX from 'xlsx';
import { Client, Product, Order, Payment, StockMovement, ClientFinancialSummary } from '../types';

export interface ExportDataParams {
  clients: Client[];
  products: Product[];
  orders: Order[];
  payments: Payment[];
  stockMovements: StockMovement[];
  clientSummaries: ClientFinancialSummary[];
  totals: {
    totalSales: number;
    totalReceived: number;
    totalDebt: number;
  };
}

export function exportFullExcelReport(data: ExportDataParams) {
  const wb = XLSX.utils.book_new();

  // -------------------------------------------------------------
  // 1. ABA: DASHBOARD / RESUMO GERAL COM FÓRMULAS AUTOMÁTICAS
  // -------------------------------------------------------------
  const summaryAoa: any[][] = [
    ['PAINEL DE CONTROLO & RESUMO EXECUTIVO (MOÇAMBIQUE - MT)'],
    ['Sistema de Gestão de Clientes, Encomendas, Dívidas e Armazém'],
    ['Gerado em:', new Date().toLocaleString('pt-MZ')],
    ['Moeda Oficial:', 'Meticais (MT)'],
    [],
    ['INDICADOR PRINCIPAL', 'FÓRMULA / VALOR EXCEL', 'NOTA'],
    [
      'Total de Vendas Faturadas (MT)',
      { f: 'SUM(Encomendas!E2:E5000)', v: data.totals.totalSales },
      'Soma automática de todas as encomendas'
    ],
    [
      'Total Recebido em Caixa (MT)',
      { f: 'SUM(Pagamentos!D2:D5000)', v: data.totals.totalReceived },
      'Soma de M-Pesa, e-Mola, Numerário e Bancos'
    ],
    [
      'Total em Dívida Acumulada (MT)',
      { f: "SUM('Clientes e Dívidas'!G2:G1000)", v: data.totals.totalDebt },
      'Saldo devedor total dos clientes'
    ],
    [
      'Percentual de Recuperação',
      { f: 'IF(B7>0, B8/B7, 0)', v: data.totals.totalSales > 0 ? data.totals.totalReceived / data.totals.totalSales : 0 },
      'Taxa de recebimento sobre vendas'
    ],
    [],
    ['ESTATÍSTICAS DO NEGÓCIO', 'QUANTIDADE', 'ESTADO'],
    [
      'Total de Clientes Registados',
      { f: "COUNTA('Clientes e Dívidas'!B2:B1000)", v: data.clients.length },
      'Clientes na base de dados'
    ],
    [
      'Clientes com Dívida Ativa',
      { f: "COUNTIF('Clientes e Dívidas'!H2:H1000, \"EM DÍVIDA\")", v: data.clientSummaries.filter(s => s.currentDebt > 0).length },
      'Requerem cobrança'
    ],
    [
      'Total de Encomendas Registadas',
      { f: 'COUNTA(Encomendas!A2:A5000)', v: data.orders.length },
      'Histórico de pedidos'
    ],
    [
      'Total de Pagamentos Registados',
      { f: 'COUNTA(Pagamentos!A2:A5000)', v: data.payments.length },
      'Recibos emitidos'
    ],
    [
      'Produtos com Stock Crítico (<= Mínimo)',
      { f: "COUNTIF('Produtos e Stock'!I2:I500, \"STOCK BAIXO\") + COUNTIF('Produtos e Stock'!I2:I500, \"ESGOTADO\")", v: data.products.filter(p => p.type === 'physical' && p.stockQuantity <= p.minStockAlert).length },
      'Alerta de reposição'
    ],
    [],
    ['GUIA DE USO DO EXCEL:'],
    ['1. As fórmulas deste ficheiro recalculam automaticamente sempre que adicionar novas linhas.'],
    ['2. Para registar um novo pagamento ou encomenda, adicione a linha na respetiva aba.'],
    ['3. O saldo do cliente na aba "Clientes e Dívidas" atualizará instantaneamente sem macros obrigatórias.']
  ];

  const wsSummary = XLSX.utils.aoa_to_sheet(summaryAoa);
  wsSummary['!cols'] = [
    { wch: 38 },
    { wch: 25 },
    { wch: 45 }
  ];
  XLSX.utils.book_append_sheet(wb, wsSummary, 'Painel Geral');

  // -------------------------------------------------------------
  // 2. ABA: CLIENTES E DÍVIDAS (COM FÓRMULAS VIVAS DE SOMA.SE)
  // -------------------------------------------------------------
  const clientsAoa: any[][] = [
    [
      'Código',
      'Nome do Cliente',
      'Contacto Telefónico',
      'Localização',
      'Total Comprado (MT)',
      'Total Pago (MT)',
      'Dívida Atual (MT)',
      'Estado da Conta',
      'Total Encomendas',
      'Total Pagamentos',
      'Observações'
    ]
  ];

  data.clients.forEach((c, idx) => {
    const rowNumber = idx + 2;
    const summary = data.clientSummaries.find(s => s.client.id === c.id);
    const clientNameEscaped = c.name.replace(/"/g, '""');

    clientsAoa.push([
      c.code,
      c.name,
      c.phone || '',
      c.location || '',
      // Formula: SUMIF(Encomendas!C:C, clientName, Encomendas!E:E)
      { f: `SUMIF(Encomendas!C$2:C$5000, B${rowNumber}, Encomendas!E$2:E$5000)`, v: summary?.totalPurchased || 0 },
      // Formula: SUMIF(Pagamentos!C:C, clientName, Pagamentos!D:D)
      { f: `SUMIF(Pagamentos!C$2:C$5000, B${rowNumber}, Pagamentos!D$2:D$5000)`, v: summary?.totalPaid || 0 },
      // Formula: MAX(0, Comprado - Pago)
      { f: `MAX(0, E${rowNumber}-F${rowNumber})`, v: summary ? Math.max(0, summary.currentDebt) : 0 },
      // Formula: Estado
      { f: `IF(G${rowNumber}>0, "EM DÍVIDA", "LIQUIDADO")`, v: (summary?.currentDebt || 0) > 0 ? 'EM DÍVIDA' : 'LIQUIDADO' },
      // Formula: Count orders
      { f: `COUNTIF(Encomendas!C$2:C$5000, B${rowNumber})`, v: summary?.orderCount || 0 },
      // Formula: Count payments
      { f: `COUNTIF(Pagamentos!C$2:C$5000, B${rowNumber})`, v: summary?.paymentCount || 0 },
      c.notes || ''
    ]);
  });

  const wsClients = XLSX.utils.aoa_to_sheet(clientsAoa);
  wsClients['!cols'] = [
    { wch: 12 }, // Código
    { wch: 28 }, // Nome
    { wch: 18 }, // Telefone
    { wch: 20 }, // Localização
    { wch: 20 }, // Total Comprado
    { wch: 18 }, // Total Pago
    { wch: 18 }, // Dívida Atual
    { wch: 16 }, // Estado
    { wch: 16 }, // Qtd Encomendas
    { wch: 16 }, // Qtd Pagamentos
    { wch: 28 }  // Observações
  ];
  XLSX.utils.book_append_sheet(wb, wsClients, 'Clientes e Dívidas');

  // -------------------------------------------------------------
  // 3. ABA: PRODUTOS E STOCK (COM CÁLCULO DE ESTADO DE STOCK)
  // -------------------------------------------------------------
  const productsAoa: any[][] = [
    [
      'Código',
      'Nome do Produto / Serviço',
      'Categoria',
      'Tipo / Natureza',
      'Preço Unitário (MT)',
      'Unidade',
      'Stock Atual',
      'Stock Mínimo',
      'Estado do Stock',
      'Estado',
      'Observações'
    ]
  ];

  data.products.forEach((p, idx) => {
    const rowNumber = idx + 2;
    const isPhysical = p.type === 'physical';

    productsAoa.push([
      p.code,
      p.name,
      p.category,
      p.type === 'digital' ? 'Digital (Sem Armazém)' : p.type === 'physical' ? 'Físico (Com Stock)' : 'Serviço',
      p.price,
      p.unit,
      isPhysical ? p.stockQuantity : 'N/A',
      isPhysical ? p.minStockAlert : 'N/A',
      isPhysical
        ? {
            f: `IF(G${rowNumber}=0, "ESGOTADO", IF(G${rowNumber}<=H${rowNumber}, "STOCK BAIXO", "NORMAL"))`,
            v: p.stockQuantity === 0 ? 'ESGOTADO' : p.stockQuantity <= p.minStockAlert ? 'STOCK BAIXO' : 'NORMAL'
          }
        : 'DISPONÍVEL',
      p.active ? 'Ativo' : 'Inativo',
      p.notes || ''
    ]);
  });

  const wsProducts = XLSX.utils.aoa_to_sheet(productsAoa);
  wsProducts['!cols'] = [
    { wch: 12 },
    { wch: 32 },
    { wch: 18 },
    { wch: 22 },
    { wch: 18 },
    { wch: 10 },
    { wch: 14 },
    { wch: 14 },
    { wch: 16 },
    { wch: 10 },
    { wch: 30 }
  ];
  XLSX.utils.book_append_sheet(wb, wsProducts, 'Produtos e Stock');

  // -------------------------------------------------------------
  // 4. ABA: ENCOMENDAS (COM CÁLCULO AUTOMÁTICO DE SALDO)
  // -------------------------------------------------------------
  const ordersAoa: any[][] = [
    [
      'Nº Encomenda',
      'Data',
      'Cliente',
      'Itens da Encomenda',
      'Valor Total (MT)',
      'Valor Pago no Ato (MT)',
      'Saldo Pendente (MT)',
      'Estado do Pagamento',
      'Tipo Entrega',
      'Observações'
    ]
  ];

  data.orders.forEach((o, idx) => {
    const rowNumber = idx + 2;
    const itemsDescription = o.items
      .map(i => `${i.quantity}x ${i.productName} (${i.unitPrice} MT)`)
      .join('; ');

    ordersAoa.push([
      o.orderNumber,
      o.date,
      o.clientName,
      itemsDescription,
      o.totalAmount,
      o.amountPaid,
      // Formula: Max(0, Total - Pago)
      { f: `MAX(0, E${rowNumber}-F${rowNumber})`, v: o.balanceDue },
      // Formula: Estado
      { f: `IF(G${rowNumber}=0, "PAGA", IF(F${rowNumber}>0, "PARCIAL", "PENDENTE"))`, v: o.status.toUpperCase() },
      o.deliveryType || 'Mista',
      o.notes || ''
    ]);
  });

  const wsOrders = XLSX.utils.aoa_to_sheet(ordersAoa);
  wsOrders['!cols'] = [
    { wch: 15 },
    { wch: 12 },
    { wch: 26 },
    { wch: 40 },
    { wch: 16 },
    { wch: 20 },
    { wch: 18 },
    { wch: 18 },
    { wch: 16 },
    { wch: 28 }
  ];
  XLSX.utils.book_append_sheet(wb, wsOrders, 'Encomendas');

  // -------------------------------------------------------------
  // 5. ABA: PAGAMENTOS E AMORTIZAÇÕES
  // -------------------------------------------------------------
  const paymentsAoa: any[][] = [
    [
      'Nº Recibo',
      'Data',
      'Cliente',
      'Valor Pago (MT)',
      'Forma de Pagamento',
      'Tipo de Operação',
      'Ref. Encomenda',
      'Observações'
    ]
  ];

  data.payments.forEach((p) => {
    paymentsAoa.push([
      p.receiptNumber,
      p.date,
      p.clientName,
      p.amount,
      p.method,
      p.type,
      p.orderNumber || 'Amortização Geral',
      p.notes || ''
    ]);
  });

  const wsPayments = XLSX.utils.aoa_to_sheet(paymentsAoa);
  wsPayments['!cols'] = [
    { wch: 14 },
    { wch: 12 },
    { wch: 26 },
    { wch: 18 },
    { wch: 24 },
    { wch: 22 },
    { wch: 18 },
    { wch: 30 }
  ];
  XLSX.utils.book_append_sheet(wb, wsPayments, 'Pagamentos');

  // -------------------------------------------------------------
  // 6. ABA: MOVIMENTOS DE STOCK / ARMAZÉM
  // -------------------------------------------------------------
  const stockAoa: any[][] = [
    [
      'Data',
      'Produto',
      'Tipo de Movimento',
      'Quantidade',
      'Stock Anterior',
      'Novo Stock',
      'Ref. Encomenda',
      'Motivo / Observações'
    ]
  ];

  data.stockMovements.forEach((m) => {
    stockAoa.push([
      m.date,
      m.productName,
      m.type === 'entrada'
        ? 'Entrada (+)'
        : m.type === 'saida_venda'
        ? 'Venda (-)'
        : m.type === 'saida_perda'
        ? 'Perda (-)'
        : 'Ajuste',
      m.quantity,
      m.previousStock,
      m.newStock,
      m.orderNumber || '—',
      m.notes || ''
    ]);
  });

  const wsStock = XLSX.utils.aoa_to_sheet(stockAoa);
  wsStock['!cols'] = [
    { wch: 12 },
    { wch: 28 },
    { wch: 18 },
    { wch: 14 },
    { wch: 16 },
    { wch: 14 },
    { wch: 16 },
    { wch: 32 }
  ];
  XLSX.utils.book_append_sheet(wb, wsStock, 'Movimentos Stock');

  // -------------------------------------------------------------
  // 7. ABA: GUIA & SCRIPTS (GOOGLE SHEETS E EXCEL)
  // -------------------------------------------------------------
  const scriptsGuideAoa: any[][] = [
    ['GUIA PARA BOTÕES E SCRIPTS NO GOOGLE SHEETS E MICROSOFT EXCEL'],
    [],
    ['=== OPÇÃO A: SE ESTÁ A USAR O GOOGLE SHEETS (GOOGLE PLANILHAS) ==='],
    ['No Google Sheets NÃO se usa ALT+F11 (esse atalho é só para o Excel de computador).'],
    ['Siga estes passos simples:'],
    ['1. No menu superior do Google Sheets, clique em: Extensões -> Apps Script.'],
    ['2. Apague o código que lá estiver e cole o seguinte script:'],
    [],
    ['function onOpen() {'],
    ['  var ui = SpreadsheetApp.getUi();'],
    ['  ui.createMenu(\'🚀 Gestão de Vendas\')'],
    ['    .addItem(\'💰 Registar Pagamento Rápido\', \'registarPagamento\')'],
    ['    .addToUi();'],
    ['}'],
    [],
    ['function registarPagamento() {'],
    ['  var ui = SpreadsheetApp.getUi();'],
    ['  var ss = SpreadsheetApp.getActiveSpreadsheet();'],
    ['  var sheet = ss.getSheetByName(\'Pagamentos\');'],
    ['  if (!sheet) { ui.alert(\'Aba Pagamentos não encontrada.\'); return; }'],
    ['  var rCli = ui.prompt(\'Registar Pagamento\', \'Nome do Cliente:\', ui.ButtonSet.OK_CANCEL);'],
    ['  if (rCli.getSelectedButton() !== ui.Button.OK) return;'],
    ['  var cliente = rCli.getResponseText().trim();'],
    ['  var rVal = ui.prompt(\'Registar Pagamento\', \'Valor em Meticais (MT):\', ui.ButtonSet.OK_CANCEL);'],
    ['  if (rVal.getSelectedButton() !== ui.Button.OK) return;'],
    ['  var valor = parseFloat(rVal.getResponseText().replace(\',\', \'.\'));'],
    ['  if (isNaN(valor) || valor <= 0) { ui.alert(\'Valor inválido!\'); return; }'],
    ['  var rForma = ui.prompt(\'Forma de Pagamento\', \'Forma (M-Pesa, e-Mola, Numerário, Banco):\', ui.ButtonSet.OK_CANCEL);'],
    ['  var forma = rForma.getResponseText().trim() || \'M-Pesa\';'],
    ['  var lastRow = sheet.getLastRow() + 1;'],
    ['  var recNum = \'REC-\' + (\'000\' + (lastRow - 1)).slice(-4);'],
    ['  var dataHoje = Utilities.formatDate(new Date(), \'GMT+2\', \'yyyy-MM-dd\');'],
    ['  sheet.appendRow([recNum, dataHoje, cliente, valor, forma, \'Amortização\', \'Via Google Sheets\', \'\']);'],
    ['  ui.alert(\'✅ Pagamento registado com sucesso! A dívida do cliente foi recalculada automaticamente.\');'],
    ['}'],
    [],
    ['3. Clique no ícone de Guardar (Disquete) no topo do Apps Script.'],
    ['4. Recarregue a página do Google Sheets. Aparecerá um novo menu no topo: "🚀 Gestão de Vendas"!'],
    ['5. Para criar um botão clicável: Vá a Inserir -> Desenho -> Desenhe um botão -> Guardar -> Clique nos 3 pontos -> Atribuir Script -> digite: registarPagamento.'],
    [],
    ['=== OPÇÃO B: SE ESTÁ A USAR O MICROSOFT EXCEL (NO COMPUTADOR) ==='],
    ['1. No Excel de computador Windows, pressione ALT + F11.'],
    ['2. Clique em Inserir -> Módulo (Insert -> Module).'],
    ['3. Cole o código VBA: Sub RegistarPagamentoRapido() ... End Sub'],
    ['4. Guarde o ficheiro como "Livro com Permissão para Macros (*.xlsm)".']
  ];

  const wsScripts = XLSX.utils.aoa_to_sheet(scriptsGuideAoa);
  wsScripts['!cols'] = [{ wch: 100 }];
  XLSX.utils.book_append_sheet(wb, wsScripts, 'Como Usar no Sheets e Excel');

  // Gerar e Descarregar o ficheiro .xlsx de forma 100% compativel
  const dateStr = new Date().toISOString().slice(0, 10);
  const fileName = `Gestao_Clientes_Vendas_Planilha_Excel_${dateStr}.xlsx`;

  try {
    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([wbout], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    a.target = '_blank';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  } catch (err) {
    console.warn('Blob download falhou, a tentar XLSX.writeFile ou fallback estático:', err);
    try {
      XLSX.writeFile(wb, fileName);
    } catch {
      // Fallback final: ficheiro estático pré-gerado
      window.open('/Gestao_Clientes_Vendas_Planilha_Excel.xlsx', '_blank');
    }
  }
}

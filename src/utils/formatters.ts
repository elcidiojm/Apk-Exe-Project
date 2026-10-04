export function formatMT(amount: number): string {
  if (isNaN(amount) || amount === null || amount === undefined) {
    return '0 MT';
  }
  // Format with thousands separator dot or space, Mozambican style
  const formatted = Math.round(amount)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `${formatted} MT`;
}

export function formatDate(dateString: string): string {
  if (!dateString) return '';
  try {
    const parts = dateString.split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  } catch {
    return dateString;
  }
}

export function getTodayDateString(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function formatOrderItemLine(item: {
  productName: string;
  quantity: number;
  unit?: string;
  category?: string;
}): string {
  const qty = item.quantity;
  const unit = (item.unit || '').trim();
  const cat = (item.category || '').toLowerCase();
  const name = item.productName || '';

  // 1. Explicit unit handling
  if (unit) {
    const uLow = unit.toLowerCase();
    if (uLow.includes('temporada')) {
      const uStr = qty === 1 ? 'Temporada' : 'Temporadas';
      return name && !name.toLowerCase().includes('série') && name !== 'Séries'
        ? `${qty} × ${uStr} (${name})`
        : `${qty} × ${uStr}`;
    }
    if (uLow.includes('filme')) {
      const uStr = qty === 1 ? 'Filme' : 'Filmes';
      return name && !name.toLowerCase().includes('filme') && name !== 'Filmes'
        ? `${qty} × ${uStr} (${name})`
        : `${qty} × ${uStr}`;
    }
    if (uLow.includes('capítulo') || uLow.includes('capitulo')) {
      const uStr = qty === 1 ? 'Capítulo' : 'Capítulos';
      return name && !name.toLowerCase().includes('novela') && name !== 'Novelas'
        ? `${qty} × ${uStr} (${name})`
        : `${qty} × ${uStr}`;
    }
    if (uLow !== 'unidade' && uLow !== '1 unidade') {
      return `${qty} × ${unit} (${name})`;
    }
  }

  // 2. Category based formatting
  if (cat.includes('série') || cat.includes('serie')) {
    const uStr = qty === 1 ? 'Temporada' : 'Temporadas';
    return name && !name.toLowerCase().includes('série') && name !== 'Séries'
      ? `${qty} × ${uStr} (${name})`
      : `${qty} × ${uStr}`;
  }

  if (cat.includes('filme')) {
    const uStr = qty === 1 ? 'Filme' : 'Filmes';
    return name && !name.toLowerCase().includes('filme') && name !== 'Filmes'
      ? `${qty} × ${uStr} (${name})`
      : `${qty} × ${uStr}`;
  }

  if (cat.includes('novela')) {
    const uStr = qty === 1 ? 'Capítulo' : 'Capítulos';
    return name && !name.toLowerCase().includes('novela') && name !== 'Novelas'
      ? `${qty} × ${uStr} (${name})`
      : `${qty} × ${uStr}`;
  }

  return `${qty} × ${name}`;
}


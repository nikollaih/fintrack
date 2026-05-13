<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<style>
/* ── Reset ────────────────────────────────────────────────────── */
* { margin:0; padding:0; box-sizing:border-box; }
body {
    font-family: DejaVu Sans, sans-serif;
    font-size: 9pt;
    color: #2D3748;
    line-height: 1.45;
    background: #fff;
    margin-top: 28px; /* space for fixed header */
    margin-bottom: 24px; /* space for fixed footer */
}

/* ── Repeating page header (all pages) ───────────────────────── */
#page-header {
    position: fixed;
    top: 0; left: 0; right: 0;
    height: 22px;
    background: #fff;
    border-bottom: 1px solid #E2E8F0;
    padding: 4px 16px;
    font-size: 7.5pt;
    color: #9CA3AF;
}
/* ── Repeating page footer ───────────────────────────────────── */
#page-footer {
    position: fixed;
    bottom: 0; left: 0; right: 0;
    height: 20px;
    background: #fff;
    border-top: 1px solid #E2E8F0;
    padding: 3px 16px;
    font-size: 7pt;
    color: #9CA3AF;
    text-align: center;
}

/* ── Page breaks ─────────────────────────────────────────────── */
.page-break { page-break-after: always; }
.bg-alert { background: #FFF7ED; }

/* ── Section heading: teal left border + gray background ─────── */
.sec-head {
    border-left: 4px solid #1D9E75;
    background: #F8F9FA;
    padding: 8px 12px;
    font-size: 11pt;
    font-weight: bold;
    color: #0C2340;
    margin-bottom: 14px;
}
.sec-num { color: #1D9E75; margin-right: 6px; font-size: 10pt; }

/* ── Tables ───────────────────────────────────────────────────── */
table { width: 100%; border-collapse: collapse; }
.tbl th {
    background: #0C2340;
    color: #fff;
    padding: 7px 10px;
    font-size: 8pt;
    text-align: left;
    font-weight: bold;
    border: 1px solid #0C2340;
}
.tbl th.ar { text-align: right; }
.tbl td {
    padding: 6px 10px;
    border: 1px solid #E2E8F0;
    font-size: 8.5pt;
    vertical-align: middle;
}
.tbl tr:nth-child(odd) td { background: #fff; }
.tbl tr:nth-child(even) td { background: #F8FFFE; }
.tbl .total-row td {
    background: #EDF2F7 !important;
    font-weight: bold;
    border-top: 2px solid #CBD5E0;
}
.ar { text-align: right; }
.ac { text-align: center; }

/* ── Colours ─────────────────────────────────────────────────── */
.c-teal  { color: #1D9E75; }
.c-red   { color: #DC2626; }
.c-navy  { color: #0C2340; }
.c-gray  { color: #6B7280; }
.c-amber { color: #D97706; }
.c-white { color: #fff; }
.c-green { color: #16A34A; }

/* ── Metric card table layout ─────────────────────────────────── */
.metric-cell {
    padding: 10px;
    background: #F8F9FA;
    border: 1px solid #E2E8F0;
    vertical-align: top;
}
.metric-label { font-size: 8pt; color: #6B7280; margin-bottom: 4px; }
.metric-value { font-size: 19pt; font-weight: bold; color: #0C2340; line-height: 1.1; }
.metric-prev  { font-size: 7.5pt; color: #9CA3AF; margin-top: 5px; }
.metric-var   { font-size: 7.5pt; font-weight: bold; margin-top: 3px; }
.var-up   { color: #16A34A; }
.var-down { color: #DC2626; }

/* ── Mini progress bar (table-based) ─────────────────────────── */
.pbar-track  { background: #E2E8F0; border-radius: 3px; height: 10px; }
.pbar-fill   { height: 10px; border-radius: 3px; }

/* ── Badges ───────────────────────────────────────────────────── */
.badge {
    display: inline-block;
    padding: 1px 5px;
    border-radius: 8px;
    font-size: 7pt;
    font-weight: bold;
}
.b-green  { background:#D1FAE5; color:#065F46; }
.b-red    { background:#FEE2E2; color:#991B1B; }
.b-amber  { background:#FEF3C7; color:#92400E; }
.b-blue   { background:#DBEAFE; color:#1E40AF; }
.b-gray   { background:#F3F4F6; color:#374151; }
.b-teal   { background:#CCFBF1; color:#065F46; }

/* ── Divider ──────────────────────────────────────────────────── */
.hr { border-top: 1px solid #E2E8F0; margin: 12px 0; }

/* ── Utilities ────────────────────────────────────────────────── */
.bold { font-weight: bold; }
.xs   { font-size: 7.5pt; }
.sm   { font-size: 8.5pt; }
.mt10 { margin-top: 10px; }
.mt14 { margin-top: 14px; }
</style>
</head>
<body>

{{-- ═══════════════ REPEATING HEADER (all pages) ═══════════════ --}}
<div id="page-header">
    <table><tr>
        <td style="width:50%;"><strong style="color:#0C2340;">FinTrack</strong></td>
        <td style="width:50%; text-align:right;">{{ $data['month_name'] }}</td>
    </tr></table>
</div>

{{-- ═══════════════ REPEATING FOOTER (all pages) ═══════════════ --}}
<div id="page-footer">
    Informe Financiero · {{ $data['month_name'] }} ·
    Generado el {{ $data['generated_at'] }}
    &nbsp;&nbsp;&nbsp;
    Página <script type="text/php">
        if (isset($pdf)) {
            echo $PAGE_NUM . ' de ' . $PAGE_COUNT;
        }
    </script>
    &nbsp;&nbsp; Este informe es de carácter informativo.
</div>

@php
$d = $data;

function fmt(float $v): string {
    return '$ ' . number_format($v, 0, ',', '.');
}
function fmtD(float $v, int $dec = 2): string {
    return '$ ' . number_format($v, $dec, ',', '.');
}
function fmtPct(float $v): string {
    return number_format($v, 1) . '%';
}
function fmtK(float $v): string {
    if (abs($v) >= 1_000_000) return '$' . number_format($v/1_000_000, 1) . 'M';
    if (abs($v) >= 1_000)     return '$' . number_format($v/1_000, 0) . 'K';
    return '$' . number_format($v, 0);
}
function varArr(float $cur, float $prev, bool $invertGood = false): array {
    $abs = $cur - $prev;
    $pct = $prev != 0 ? ($abs / abs($prev)) * 100 : 0;
    $up  = $abs >= 0;
    $good = $invertGood ? !$up : $up;
    return ['abs'=>$abs,'pct'=>$pct,'up'=>$up,'good'=>$good];
}
function varHtml(array $v): string {
    $cls   = $v['good'] ? 'var-up' : 'var-down';
    $arrow = $v['up'] ? '&#9650;' : '&#9660;';
    $sign  = $v['abs'] >= 0 ? '+' : '';
    $fmtV  = '$' . number_format(abs($v['abs']), 0, ',', '.');
    return "<span class=\"metric-var {$cls}\">{$arrow} {$sign}{$fmtV} (" . ($sign) . number_format($v['pct'],1) . '%)</span>';
}
@endphp

{{-- ════════════════════════════════════════════════════════════════
     § 1 · CARÁTULA
════════════════════════════════════════════════════════════════ --}}
<div class="page-break" style="margin-top:-28px;">

  {{-- Navy header bar --}}
  <div style="background:#0C2340; padding:28px 40px 20px;">
    <div style="font-size:28pt; font-weight:bold; color:#fff; letter-spacing:1px;">FinTrack</div>
    <div style="font-size:10pt; color:#94A3B8; margin-top:4px;">Plataforma de finanzas personales y agro</div>
  </div>

  {{-- Teal divider --}}
  <div style="height:5px; background:#1D9E75;"></div>

  {{-- Cover body --}}
  <div style="padding:60px 40px 40px; text-align:center;">
    <div style="font-size:11pt; color:#6B7280; text-transform:uppercase; letter-spacing:2px; margin-bottom:16px;">
        Informe Financiero Mensual
    </div>
    <div style="font-size:26pt; font-weight:bold; color:#0C2340; margin-bottom:10px;">
        {{ $d['month_name'] }}
    </div>
    <div style="font-size:14pt; color:#1D9E75; margin-bottom:40px;">{{ $d['tenant_name'] }}</div>

    <div style="border-top:1px solid #E2E8F0; padding-top:30px; margin-top:10px;">
        <div style="font-size:9pt; color:#9CA3AF;">Generado el {{ $d['generated_at'] }}</div>
        @if($d['is_past_month'])
        <div style="margin-top:16px; background:#FFFBEB; border:1px solid #FDE68A; padding:10px 16px; border-radius:4px; font-size:8.5pt; color:#92400E; text-align:left;">
            <strong>Nota:</strong> Este informe corresponde a un mes pasado. Si algún gasto fijo aparece como pendiente,
            puede deberse a que el pago no fue registrado en el sistema, no necesariamente a que no fue pagado.
        </div>
        @endif
    </div>
  </div>
</div>

{{-- ════════════════════════════════════════════════════════════════
     § 2 · RESUMEN EJECUTIVO
════════════════════════════════════════════════════════════════ --}}
<div class="page-break">
<div class="sec-head"><span class="sec-num">2</span>Resumen Ejecutivo
  <span style="font-size:9pt; font-weight:normal; color:#6B7280;"> · {{ $d['month_name'] }} vs {{ $d['prev_month_name'] }}</span>
</div>

@php $s = $d['summary']; @endphp

{{-- Row 1: Ingresos | Gastos | Resultado --}}
<table style="margin-bottom:10px;">
<tr>
  <td class="metric-cell" style="width:33%;">
    <div class="metric-label">Ingresos totales</div>
    <div class="metric-value c-teal">{{ fmt($s['total_income']) }}</div>
    <div class="metric-prev">Anterior: {{ fmt($s['prev_income']) }}</div>
    {!! varHtml(varArr($s['total_income'], $s['prev_income'])) !!}
  </td>
  <td style="width:1%; border:none;"></td>
  <td class="metric-cell" style="width:33%;">
    <div class="metric-label">Gastos totales</div>
    <div class="metric-value c-red">{{ fmt($s['total_expenses']) }}</div>
    <div class="metric-prev">Anterior: {{ fmt($s['prev_expenses']) }}</div>
    {!! varHtml(varArr($s['total_expenses'], $s['prev_expenses'], true)) !!}
  </td>
  <td style="width:1%; border:none;"></td>
  <td class="metric-cell" style="width:33%;">
    @php $netColor = $s['net_result'] >= 0 ? 'c-teal' : 'c-red'; @endphp
    <div class="metric-label">Resultado neto</div>
    <div class="metric-value {{ $netColor }}">{{ fmt($s['net_result']) }}</div>
    <div class="metric-prev">Anterior: {{ fmt($s['prev_net']) }}</div>
    {!! varHtml(varArr($s['net_result'], $s['prev_net'])) !!}
  </td>
</tr>
</table>

{{-- Row 2: Patrimonio neto | Tasa de ahorro --}}
<table>
<tr>
  <td class="metric-cell" style="width:49%;">
    <div class="metric-label">Patrimonio neto (cuentas + activos)</div>
    <div class="metric-value {{ $s['net_worth'] >= 0 ? '' : 'c-red' }}">{{ fmt($s['net_worth']) }}</div>
    <div class="metric-prev">Anterior: {{ fmt($s['prev_net_worth']) }}</div>
    {!! varHtml(varArr($s['net_worth'], $s['prev_net_worth'])) !!}
    @if($s['asset_portfolio'] > 0)
    <div class="xs c-gray mt10">Portafolio de activos: {{ fmt($s['asset_portfolio']) }}</div>
    @endif
  </td>
  <td style="width:2%; border:none;"></td>
  <td class="metric-cell" style="width:49%;">
    @php
        $sr = $s['savings_rate'];
        $srColor = $sr < 0 ? 'c-red' : ($sr < 10 ? 'c-amber' : 'c-teal');
        $psr = $s['prev_savings_rate'];
        $diff = $sr - $psr;
    @endphp
    <div class="metric-label">Tasa de ahorro</div>
    <div class="metric-value {{ $srColor }}">{{ fmtPct($sr) }}</div>
    <div class="metric-prev">Anterior: {{ fmtPct($psr) }}</div>
    <span class="metric-var {{ $diff >= 0 ? 'var-up' : 'var-down' }}">
        {{ $diff >= 0 ? '&#9650;' : '&#9660;' }} {{ $diff >= 0 ? '+' : '' }}{{ fmtPct($diff) }} pp
    </span>
  </td>
</tr>
</table>

{{-- Context box --}}
<div class="mt14" style="background:{{ $s['net_result'] >= 0 ? '#F0FDF4' : '#FFF7ED' }}; border-left:3px solid {{ $s['net_result'] >= 0 ? '#16A34A' : '#D97706' }}; padding:8px 12px;">
    <span class="sm">
        @if($s['net_result'] > 0)
        ✓ Mes positivo: los ingresos superaron los gastos en <strong>{{ fmt($s['net_result']) }}</strong>.
        @elseif($s['net_result'] < 0)
        ⚠ Los gastos superaron los ingresos en <strong>{{ fmt(abs($s['net_result'])) }}</strong> este mes.
        @else
        El resultado neto del mes fue cero.
        @endif
    </span>
</div>
</div>

{{-- ════════════════════════════════════════════════════════════════
     § 3 · INGRESOS POR CATEGORÍA
════════════════════════════════════════════════════════════════ --}}
<div class="page-break">
<div class="sec-head"><span class="sec-num">3</span>Desglose de Ingresos</div>

@if(count($d['income_by_category']) === 0)
<p class="sm c-gray">Sin ingresos registrados en transacciones para este mes.</p>
@else
<table class="tbl">
<thead><tr>
    <th style="width:38%">Categoría</th>
    <th class="ar" style="width:20%">Monto</th>
    <th class="ar" style="width:11%">% total</th>
    <th class="ar" style="width:17%">Mes anterior</th>
    <th class="ar" style="width:14%">Variación</th>
</tr></thead>
<tbody>
@foreach($d['income_by_category'] as $cat)
@php $prev = $d['prev_income_by_cat']->get($cat['name'], 0); $v = varArr($cat['amount'], $prev); @endphp
<tr>
    <td>
        <span style="display:inline-block;width:9px;height:9px;background:{{ $cat['color'] }};border-radius:50%;vertical-align:middle;margin-right:4px;"></span>
        {{ $cat['name'] }}
    </td>
    <td class="ar bold">{{ fmt($cat['amount']) }}</td>
    <td class="ar">{{ fmtPct($cat['pct']) }}</td>
    <td class="ar c-gray">{{ $prev > 0 ? fmt($prev) : '—' }}</td>
    <td class="ar {{ $v['good'] ? 'c-green' : 'c-red' }}">
        {{ $prev > 0 ? ($v['abs'] >= 0 ? '+' : '') . fmtPct($v['pct']) : '—' }}
    </td>
</tr>
@endforeach
<tr class="total-row">
    <td>TOTAL INGRESOS</td>
    <td class="ar c-teal">{{ fmt($d['summary']['total_income']) }}</td>
    <td class="ar">100%</td>
    <td class="ar c-gray">{{ fmt($d['summary']['prev_income']) }}</td>
    <td></td>
</tr>
</tbody></table>
@endif
</div>

{{-- ════════════════════════════════════════════════════════════════
     § 4 · GASTOS POR CATEGORÍA
════════════════════════════════════════════════════════════════ --}}
<div class="page-break">
<div class="sec-head"><span class="sec-num">4</span>Desglose de Gastos</div>

@if(count($d['expenses_by_category']) === 0)
<p class="sm c-gray">Sin gastos registrados en transacciones para este mes.</p>
@else
@php $maxExp = collect($d['expenses_by_category'])->take(8)->max('amount') ?: 1; @endphp

<p class="bold sm" style="margin-bottom:8px;">Top 8 — gráfica de barras</p>
<table style="margin-bottom:16px;">
@foreach(collect($d['expenses_by_category'])->take(8) as $cat)
@php
    $prev = $d['prev_exp_by_cat']->get($cat['name'], 0);
    $pctChg = $prev > 0 ? (($cat['amount'] - $prev) / $prev) * 100 : 0;
    $isHigh = $prev > 0 && $pctChg > 20;
    $bw = max(2, round(($cat['amount'] / $maxExp) * 100));
    $bc = $isHigh ? '#D97706' : $cat['color'];
@endphp
<tr>
    <td style="width:28%; font-size:8pt; padding:3px 8px 3px 0; vertical-align:middle;">
        {{ $cat['name'] }}
        @if($isHigh) <span class="badge b-amber">+{{ round($pctChg) }}%</span> @endif
    </td>
    <td style="width:54%; padding:2px 0; vertical-align:middle;">
        <div class="pbar-track"><div class="pbar-fill" style="width:{{ $bw }}%; background:{{ $bc }};"></div></div>
    </td>
    <td style="width:18%; font-size:8pt; text-align:right; padding:2px 0 2px 8px; vertical-align:middle; font-weight:bold;">{{ fmt($cat['amount']) }}</td>
</tr>
@endforeach
</table>
<p class="xs c-amber" style="margin-bottom:12px;">⚠ Ámbar = incremento superior al 20% respecto al mes anterior.</p>

<div class="hr"></div>
<table class="tbl">
<thead><tr>
    <th style="width:36%">Categoría</th>
    <th class="ar" style="width:20%">Monto</th>
    <th class="ar" style="width:11%">% total</th>
    <th class="ar" style="width:17%">Mes anterior</th>
    <th class="ar" style="width:16%">Variación</th>
</tr></thead>
<tbody>
@foreach($d['expenses_by_category'] as $cat)
@php
    $prev = $d['prev_exp_by_cat']->get($cat['name'], 0);
    $v = varArr($cat['amount'], $prev, true);
    $hiInc = $prev > 0 && $v['pct'] > 20;
@endphp
<tr @if($hiInc) style="background:#FFFBEB !important;" @endif>
    <td>
        <span style="display:inline-block;width:9px;height:9px;background:{{ $cat['color'] }};border-radius:50%;vertical-align:middle;margin-right:4px;"></span>
        {{ $cat['name'] }}
        @if($hiInc) <span class="badge b-amber">&#8593;</span> @endif
    </td>
    <td class="ar bold">{{ fmt($cat['amount']) }}</td>
    <td class="ar">{{ fmtPct($cat['pct']) }}</td>
    <td class="ar c-gray">{{ $prev > 0 ? fmt($prev) : '—' }}</td>
    <td class="ar {{ $v['good'] ? 'c-green' : 'c-red' }}">
        {{ $prev > 0 ? ($v['abs'] >= 0 ? '+' : '') . fmtPct($v['pct']) : '—' }}
    </td>
</tr>
@endforeach
<tr class="total-row">
    <td>TOTAL GASTOS</td>
    <td class="ar c-red">{{ fmt($d['summary']['total_expenses']) }}</td>
    <td class="ar">100%</td>
    <td class="ar c-gray">{{ fmt($d['summary']['prev_expenses']) }}</td>
    <td></td>
</tr>
</tbody></table>
@endif
</div>

{{-- ════════════════════════════════════════════════════════════════
     § 5 · GASTOS FIJOS
════════════════════════════════════════════════════════════════ --}}
<div class="page-break">
<div class="sec-head"><span class="sec-num">5</span>Cumplimiento de Gastos Fijos</div>

@if($d['is_past_month'])
<div style="background:#FFFBEB; border:1px solid #FDE68A; padding:7px 10px; margin-bottom:10px; font-size:8pt; color:#92400E;">
    ⚠ Mes pasado: los ítems sin pago pueden reflejar datos no ingresados, no necesariamente falta de pago real.
</div>
@endif

@if(count($d['fixed_expenses']) === 0)
<p class="sm c-gray">Sin gastos fijos configurados.</p>
@else
@php
$feList  = collect($d['fixed_expenses']);
$paid    = $feList->where('is_paid', true);
$unpaid  = $feList->where('is_paid', false);
$paidAmt = $paid->sum('amount');
$totAmt  = $feList->sum('amount');
$paidPct = $totAmt > 0 ? round(($paidAmt / $totAmt) * 100) : 0;
@endphp

{{-- Progress bar --}}
<div style="margin-bottom:12px;">
<table>
<tr>
    <td style="width:30%; font-size:8pt; color:#6B7280; padding:0 8px 0 0; white-space:nowrap;">
        {{ $paid->count() }} / {{ $feList->count() }} pagados &nbsp;
        <span class="{{ $paidPct === 100 ? 'c-teal' : 'c-amber' }} bold">{{ $paidPct }}%</span>
    </td>
    <td style="padding:2px 0;">
        <div class="pbar-track" style="height:14px;">
            <div class="pbar-fill" style="width:{{ $paidPct }}%; height:14px; background:{{ $paidPct === 100 ? '#1D9E75' : '#D97706' }};"></div>
        </div>
    </td>
    <td style="width:20%; font-size:8pt; text-align:right; padding-left:8px; white-space:nowrap;">
        {{ fmt($paidAmt) }} / {{ fmt($totAmt) }}
    </td>
</tr>
</table>
</div>

<table class="tbl">
<thead><tr>
    <th style="width:28%">Nombre</th>
    <th style="width:18%">Categoría</th>
    <th class="ar" style="width:16%">Monto</th>
    <th class="ac" style="width:14%">Estado</th>
    <th class="ac" style="width:14%">Fecha pago</th>
    <th class="ac" style="width:10%">Transacción</th>
</tr></thead>
<tbody>
@foreach($d['fixed_expenses'] as $fe)
<tr @if(!$fe['is_paid']) style="background:#FFF7ED !important;" @endif
    @if($fe['missed_consecutive']) style="background:#FEF2F2 !important;" @endif>
    <td class="bold">
        {{ $fe['name'] }}
        @if($fe['missed_consecutive']) <span class="badge b-red">2 meses</span> @endif
    </td>
    <td class="c-gray xs">{{ $fe['category'] }}</td>
    <td class="ar bold">{{ fmt($fe['amount']) }}</td>
    <td class="ac">
        @if($fe['is_paid'])
        <span style="color:#16A34A; font-weight:bold;">&#10003; Pagado</span>
        @else
        <span style="color:#DC2626; font-weight:bold;">&#10007; Pendiente</span>
        @endif
    </td>
    <td class="ac xs c-gray">{{ $fe['paid_at'] ?? '—' }}</td>
    <td class="ac">
        @if($fe['has_transaction'])
        <span class="badge b-teal">&#10003;</span>
        @else
        <span class="badge b-gray">—</span>
        @endif
    </td>
</tr>
@endforeach
<tr class="total-row">
    <td colspan="2">TOTAL</td>
    <td class="ar">{{ fmt($totAmt) }}</td>
    <td class="ac c-teal">{{ fmt($paidAmt) }}</td>
    <td class="ac c-red">{{ fmt($totAmt - $paidAmt) }}</td>
    <td></td>
</tr>
</tbody></table>
@endif
</div>

{{-- ════════════════════════════════════════════════════════════════
     § 6 · ACTIVOS E INVERSIONES
════════════════════════════════════════════════════════════════ --}}
<div class="page-break">
<div class="sec-head"><span class="sec-num">6</span>Activos e Inversiones</div>

@if(count($d['assets']) === 0)
<p class="sm c-gray">Sin activos configurados.</p>
@else
@php $startTotal=0; $endTotal=0; $intTotal=0; @endphp
@foreach($d['assets'] as $a)
@php
    $startTotal += $a['start_balance'];
    $endTotal   += $a['end_balance'];
    $intTotal   += $a['interest_this_month'];
@endphp
<div style="border:1px solid #E2E8F0; border-radius:4px; margin-bottom:14px; overflow:hidden;">
  {{-- Asset header --}}
  <div style="background:#F8F9FA; padding:8px 12px; border-bottom:1px solid #E2E8F0;">
    <table><tr>
      <td style="width:55%;">
        <span class="bold" style="font-size:10pt;">{{ $a['name'] }}</span>
        <span class="xs c-gray" style="margin-left:6px;">{{ $a['type'] }}
        @if($a['rate_ea']) · {{ fmtPct($a['rate_ea'] * 100) }} EA @endif
        @if($a['maturity_date'])
          · Vence {{ $a['maturity_date'] }}
          @if($a['days_to_mat'] !== null && $a['days_to_mat'] <= 60)
            <span class="badge b-amber">{{ $a['days_to_mat'] }}d</span>
          @endif
        @endif
        </span>
      </td>
      <td style="width:22%; text-align:right;">
        <div class="xs c-gray">Saldo final mes</div>
        <div class="bold" style="font-size:11pt;">{{ fmt($a['end_balance']) }}</div>
      </td>
      <td style="width:23%; text-align:right;">
        <div class="xs c-gray">Interés acumulado (total)</div>
        <div class="bold c-teal" style="font-size:10pt;">+{{ fmtD($a['interest_since_inception']) }}</div>
      </td>
    </tr></table>
  </div>

  {{-- Figures row --}}
  <div style="padding:8px 12px;">
    <table>
    <tr>
      <td style="width:20%;">
        <div class="xs c-gray">Saldo inicio mes</div>
        <div class="sm bold">{{ fmt($a['start_balance']) }}</div>
      </td>
      <td style="width:18%;">
        <div class="xs c-gray">Depósitos</div>
        <div class="sm bold {{ $a['deposits'] > 0 ? 'c-teal' : 'c-gray' }}">
            {{ $a['deposits'] > 0 ? '+'.fmt($a['deposits']) : '—' }}
        </div>
      </td>
      <td style="width:18%;">
        <div class="xs c-gray">Retiros</div>
        <div class="sm bold {{ $a['withdrawals'] > 0 ? 'c-red' : 'c-gray' }}">
            {{ $a['withdrawals'] > 0 ? '-'.fmt($a['withdrawals']) : '—' }}
        </div>
      </td>
      <td style="width:22%;">
        <div class="xs c-gray">Interés del mes</div>
        <div class="sm bold c-teal">+{{ fmtD($a['interest_this_month']) }}</div>
      </td>
      @if($a['maturity_value'])
      <td style="width:22%; text-align:right;">
        <div class="xs c-gray">Proyección al vencimiento</div>
        <div class="sm bold" style="color:#0C2340;">{{ fmt($a['maturity_value']) }}</div>
      </td>
      @endif
    </tr>
    </table>

    {{-- Progress bar: proportion of term elapsed --}}
    @if($a['rate_ea'] && $a['rate_ea'] > 0)
    <div style="margin-top:8px;">
      <table><tr>
        <td style="width:30%; font-size:7pt; color:#9CA3AF; padding-right:6px; white-space:nowrap;">
            Plazo transcurrido ({{ $a['progress_pct'] }}%)
        </td>
        <td>
          <div class="pbar-track" style="height:8px;">
            <div class="pbar-fill" style="width:{{ $a['progress_pct'] }}%; height:8px; background:#1D9E75;"></div>
          </div>
        </td>
        <td style="width:20%; text-align:right; font-size:7pt; color:#9CA3AF; padding-left:6px; white-space:nowrap;">
            desde {{ $a['start_date'] }}
        </td>
      </tr></table>
    </div>
    @endif
  </div>
</div>
@endforeach

{{-- Portfolio total --}}
<div style="background:#EDF2F7; padding:8px 12px; border-radius:4px;">
<table><tr>
    <td class="bold" style="width:40%;">TOTAL PORTAFOLIO</td>
    <td style="width:30%; text-align:right;">Inicio: {{ fmt($startTotal) }}</td>
    <td style="width:30%; text-align:right;">
        <span class="bold" style="font-size:11pt;">Final: {{ fmt($endTotal) }}</span>
        <span class="{{ ($endTotal-$startTotal)>=0 ? 'c-teal':'c-red' }} xs" style="margin-left:6px;">
            {{ ($endTotal-$startTotal)>=0?'+':'' }}{{ fmt($endTotal-$startTotal) }}
        </span>
    </td>
</tr></table>
</div>
@endif
</div>

{{-- ════════════════════════════════════════════════════════════════
     § 7 · CUENTAS BANCARIAS
════════════════════════════════════════════════════════════════ --}}
<div class="{{ $d['has_agro'] ? 'page-break' : '' }}">
<div class="sec-head"><span class="sec-num">7</span>Resumen de Cuentas Bancarias</div>

@if(count($d['accounts']) === 0)
<p class="sm c-gray">Sin cuentas configuradas.</p>
@else
@php
$assetAccs = collect($d['accounts'])->where('is_credit_card', false);
$ccAccs    = collect($d['accounts'])->where('is_credit_card', true);
@endphp

@if($assetAccs->isNotEmpty())
<p class="bold sm" style="margin-bottom:6px;">Cuentas de activos</p>
<table class="tbl" style="margin-bottom:14px;">
<thead><tr>
    <th style="width:22%">Cuenta</th>
    <th class="ar" style="width:15%">Apertura</th>
    <th class="ar" style="width:12%">Entradas</th>
    <th class="ar" style="width:12%">Salidas</th>
    <th class="ar" style="width:13%">Transf. +</th>
    <th class="ar" style="width:13%">Transf. -</th>
    <th class="ar" style="width:13%">Cierre</th>
</tr></thead>
<tbody>
@foreach($assetAccs as $acc)
<tr>
    <td class="bold">{{ $acc['name'] }}<div class="xs c-gray">{{ $acc['type'] }}</div></td>
    <td class="ar">{{ fmt($acc['opening']) }}</td>
    <td class="ar c-teal">{{ $acc['inflows']>0 ? '+'.fmt($acc['inflows']) : '—' }}</td>
    <td class="ar c-red">{{ $acc['outflows']>0 ? '-'.fmt($acc['outflows']) : '—' }}</td>
    <td class="ar" style="color:#2563EB;">{{ $acc['transfers_in']>0 ? '+'.fmt($acc['transfers_in']) : '—' }}</td>
    <td class="ar c-amber">{{ $acc['transfers_out']>0 ? '-'.fmt($acc['transfers_out']) : '—' }}</td>
    <td class="ar bold">{{ fmt($acc['closing']) }}</td>
</tr>
@endforeach
</tbody></table>
@endif

@if($ccAccs->isNotEmpty())
<p class="bold sm c-red" style="margin-bottom:6px;">Pasivos — Tarjetas de Crédito</p>
<table class="tbl">
<thead><tr>
    <th style="width:22%">Tarjeta</th>
    <th class="ar" style="width:18%">Deuda apertura</th>
    <th class="ar" style="width:16%">Compras mes</th>
    <th class="ar" style="width:18%">Pagos (transf.)</th>
    <th class="ar" style="width:14%">Deuda cierre</th>
    <th class="ar" style="width:12%">Variación</th>
</tr></thead>
<tbody>
@foreach($ccAccs as $acc)
@php $dc = $acc['closing'] - $acc['opening']; @endphp
<tr>
    <td class="bold">{{ $acc['name'] }}</td>
    <td class="ar c-red">{{ fmt($acc['opening']) }}</td>
    <td class="ar c-red">{{ $acc['outflows']>0 ? '+'.fmt($acc['outflows']) : '—' }}</td>
    <td class="ar c-teal">{{ $acc['transfers_in']>0 ? '-'.fmt($acc['transfers_in']) : '—' }}</td>
    <td class="ar bold c-red">{{ fmt($acc['closing']) }}</td>
    <td class="ar {{ $dc<=0 ? 'c-teal' : 'c-red' }}">{{ ($dc>=0?'+':'').fmt($dc) }}</td>
</tr>
@endforeach
</tbody></table>
@endif
@endif
</div>

{{-- ════════════════════════════════════════════════════════════════
     § 8 · AGRO (condicional)
════════════════════════════════════════════════════════════════ --}}
@if($d['has_agro'])
<div class="page-break">
<div class="sec-head"><span class="sec-num">8</span>Resumen Agrícola</div>

@foreach($d['crop_cycles'] as $cycle)
<div style="border:1px solid #D1FAE5; border-radius:4px; padding:10px 12px; margin-bottom:12px; background:#F0FDF4;">
  <table style="margin-bottom:6px;"><tr>
    <td style="width:50%;">
        <span class="bold" style="font-size:10pt;">{{ $cycle['crop_type'] }}</span>
        <span class="badge b-{{ $cycle['status']==='active'?'blue':'teal' }}" style="margin-left:6px;">{{ $cycle['status'] }}</span>
        <div class="xs c-gray">{{ $cycle['location'] }} · Sembrado {{ $cycle['sown_at'] }}
        @if($cycle['expected_harvest']) · Cosecha est. {{ $cycle['expected_harvest'] }}
          @if($cycle['days_to_harvest'] !== null && $cycle['days_to_harvest'] <= 30)
            <span class="badge b-amber">{{ $cycle['days_to_harvest'] }}d</span>
          @endif
        @endif
        </div>
    </td>
    <td style="width:25%; text-align:right;">
        <div class="xs c-gray">Ventas del mes</div>
        <div class="bold c-teal">{{ fmt($cycle['month_revenue']) }}</div>
    </td>
    <td style="width:25%; text-align:right;">
        <div class="xs c-gray">P&G acumulado</div>
        <div class="bold {{ $cycle['profit']>=0?'c-teal':'c-red' }}">{{ fmt($cycle['profit']) }}</div>
    </td>
  </tr></table>
  @if($cycle['expenses_phase']->isNotEmpty())
  <p class="xs bold" style="margin-bottom:3px;">Gastos del mes por fase:</p>
  @foreach($cycle['expenses_phase'] as $ph => $amt)
  <span class="xs c-gray">{{ ucfirst($ph) }}: <strong>{{ fmt($amt) }}</strong> &nbsp;</span>
  @endforeach
  @endif
</div>
@endforeach
</div>
@endif

{{-- ════════════════════════════════════════════════════════════════
     § 9 · TENDENCIA 6 MESES — gráfica vertical de barras
════════════════════════════════════════════════════════════════ --}}
<div class="page-break">
<div class="sec-head"><span class="sec-num">{{ $d['has_agro'] ? 9 : 8 }}</span>Tendencia de los Últimos 6 Meses</div>

@php
$trend  = $d['trend'];
$allInc = array_column($trend, 'income');
$allExp = array_column($trend, 'expenses');
$barMax = max(max($allInc), max($allExp), 1);
$barH   = 60; // max bar height px
@endphp

{{-- Vertical bar chart --}}
<div style="margin-bottom:6px; font-size:7.5pt; color:#6B7280;">
    <span style="display:inline-block; width:12px; height:10px; background:#1D9E75; vertical-align:middle; margin-right:3px;"></span> Ingresos &nbsp;
    <span style="display:inline-block; width:12px; height:10px; background:#FF6B6B; vertical-align:middle; margin-right:3px;"></span> Gastos
</div>

<table style="border-collapse:collapse; margin-bottom:4px;">
<tr>
    {{-- Y-axis label --}}
    <td style="width:3%; vertical-align:bottom; padding:0 4px 20px 0; font-size:7pt; color:#9CA3AF; text-align:right;">
        {{ fmtK($barMax) }}
    </td>
    @foreach($trend as $t)
    @php
        $ih = $barMax > 0 ? round(($t['income'] / $barMax) * $barH) : 0;
        $eh = $barMax > 0 ? round(($t['expenses'] / $barMax) * $barH) : 0;
    @endphp
    <td style="width:15%; text-align:center; vertical-align:bottom; padding:0 3px;">
        {{-- Amount labels above bars --}}
        <div style="font-size:6.5pt; color:#1D9E75; text-align:center; height:14px; line-height:14px;">
            {{ $t['income']>0 ? fmtK($t['income']) : '' }}
        </div>
        {{-- Bar container --}}
        <div style="position:relative; height:{{ $barH }}px; width:100%;">
            {{-- Income bar (left half) --}}
            <div style="position:absolute; bottom:0; left:4%; width:42%; height:{{ $ih }}px; background:#1D9E75; border-radius:2px 2px 0 0;"></div>
            {{-- Expense bar (right half) --}}
            <div style="position:absolute; bottom:0; right:4%; width:42%; height:{{ $eh }}px; background:#FF6B6B; border-radius:2px 2px 0 0;"></div>
        </div>
        <div style="font-size:6.5pt; color:#DC2626; text-align:center; height:14px; line-height:14px;">
            {{ $t['expenses']>0 ? fmtK($t['expenses']) : '' }}
        </div>
        {{-- Month label --}}
        <div style="font-size:7pt; color:#6B7280; text-align:center; margin-top:3px; border-top:1px solid #E2E8F0; padding-top:2px;">
            {{ $t['short'] }}
        </div>
    </td>
    @endforeach
</tr>
</table>

{{-- Data table --}}
<div class="hr"></div>
<table class="tbl" style="margin-top:10px;">
<thead><tr>
    <th style="width:28%">Mes</th>
    <th class="ar" style="width:18%">Ingresos</th>
    <th class="ar" style="width:18%">Gastos</th>
    <th class="ar" style="width:16%">Neto mes</th>
    <th class="ar" style="width:10%">Activos</th>
    <th class="ar" style="width:10%">Patrimonio</th>
</tr></thead>
<tbody>
@foreach($trend as $t)
@php $net = $t['income'] - $t['expenses']; @endphp
<tr>
    <td class="bold">{{ $t['label'] }}</td>
    <td class="ar c-teal">{{ $t['income']>0 ? fmt($t['income']) : '—' }}</td>
    <td class="ar c-red">{{ $t['expenses']>0 ? fmt($t['expenses']) : '—' }}</td>
    <td class="ar {{ $net>=0?'c-teal':'c-red' }} bold">{{ ($net>=0?'+':'').fmt($net) }}</td>
    <td class="ar xs c-gray">{{ $t['asset_total']>0 ? fmtK($t['asset_total']) : '—' }}</td>
    <td class="ar bold">{{ $t['net_worth']>0 ? fmt($t['net_worth']) : '—' }}</td>
</tr>
@endforeach
</tbody></table>
</div>

{{-- ════════════════════════════════════════════════════════════════
     § (L) · PASIVOS Y DEUDAS
════════════════════════════════════════════════════════════════ --}}
@if(count($d['liabilities']) > 0)
<div class="page-break">
<div class="sec-head"><span class="sec-num">P</span>Pasivos y Deudas</div>

<table class="tbl">
<thead><tr>
    <th style="width:28%">Pasivo</th>
    <th class="ar" style="width:16%">Saldo Actual</th>
    <th class="ar" style="width:14%">Cuota Mens.</th>
    <th class="ar" style="width:12%">Tasa Anual</th>
    <th class="ar" style="width:13%">Capital Pagado</th>
    <th class="ar" style="width:13%">Interés Pagado</th>
    <th class="ac" style="width:4%">Estado</th>
</tr></thead>
<tbody>
@foreach($d['liabilities'] as $li)
<tr class="{{ $li['missed'] ? 'bg-alert' : '' }}">
    <td class="bold">{{ $li['name'] }}</td>
    <td class="ar c-red bold">{{ fmt($li['outstanding']) }}</td>
    <td class="ar">{{ fmt($li['monthly_payment']) }}</td>
    <td class="ar xs">{{ number_format($li['annual_rate'] * 100, 2) }}%</td>
    <td class="ar c-teal">{{ $li['principal_paid'] > 0 ? fmt($li['principal_paid']) : '—' }}</td>
    <td class="ar c-gray">{{ $li['interest_paid'] > 0 ? fmt($li['interest_paid']) : '—' }}</td>
    <td class="ac xs {{ $li['missed'] ? 'c-red bold' : 'c-teal' }}">{{ $li['missed'] ? '!' : '✓' }}</td>
</tr>
@endforeach
</tbody>
<tfoot><tr>
    <td class="bold">Total Deuda</td>
    <td class="ar bold c-red">{{ fmt($d['total_liability_debt']) }}</td>
    <td colspan="5"></td>
</tr></tfoot>
</table>
@php
$missedLiabilities = collect($d['liabilities'])->where('missed', true);
@endphp
@if($missedLiabilities->count() > 0)
<div style="margin-top:8px; padding:7px 10px; background:#FEF3C7; border-left:3px solid #F59E0B; border-radius:0 4px 4px 0; font-size:8pt;">
    <strong>⚠ Atención:</strong> {{ $missedLiabilities->count() }} cuota(s) sin registrar este mes:
    {{ $missedLiabilities->pluck('name')->implode(', ') }}.
</div>
@endif
</div>
@endif

{{-- ════════════════════════════════════════════════════════════════
     § 10 · OBSERVACIONES AUTOMÁTICAS
════════════════════════════════════════════════════════════════ --}}
<div>
<div class="sec-head"><span class="sec-num">{{ $d['has_agro'] ? 10 : 9 }}</span>Observaciones Automáticas</div>
<p class="xs c-gray" style="margin-bottom:12px;">
    Análisis generado automáticamente con base en los datos del período {{ $d['month_name'] }}.
</p>

@if(count($d['observations']) === 0)
<p class="sm c-gray">Sin observaciones destacadas para este período.</p>
@else
@foreach($d['observations'] as $i => $obs)
<div style="margin-bottom:9px; padding:9px 12px; background:#F8F9FA; border-left:3px solid #1D9E75; border-radius:0 4px 4px 0;">
    <table><tr>
        <td style="width:22px; vertical-align:top; padding-top:1px; font-size:9pt; font-weight:bold; color:#1D9E75;">{{ $i + 1 }}</td>
        <td class="sm">{{ $obs }}</td>
    </tr></table>
</div>
@endforeach
@endif
</div>

</body>
</html>

// registry.ts — the catalog's Definition registry. Each Definition declares a canonical value-set
// owned by a catalog module. Domain modules register THEIR value-sets here as they're authored/
// back-ported (e.g. copafix's compliance/equipment/scheduling Definitions land with their modules,
// post-spine — convergence kit Bundle 7); this seed holds only the catalog-level / system value-sets
// that already exist in the catalog (control-plane registry states + the platform Resource/Connection
// type sets), proving the home with real content without authoring a domain module.
//
// Field order is fixed (type, owner, open?, values) so the DEFINITIONS.md generator can scan it.
import { createRegistry, type Definition } from './types.js';

export const CATALOG_DEFINITIONS = {
  // ── control-plane (the fleet registry's own lifecycle value-sets) ───────────────────────────────
  app_lifecycle_status: {
    type: 'status', owner: 'control-plane',
    values: ['provisioning', 'active', 'paused', 'decommissioned'],
    note: 'ClientApp.status — where a managed app is in its lifecycle.',
  },
  stage_promotion_gate: {
    type: 'kind', owner: 'control-plane',
    values: ['manual', 'automatic', 'time-based'],
    note: 'Stage.promotionGate — how a deploy promotes between stages.',
  },
  resource_instance_status: {
    type: 'status', owner: 'control-plane',
    values: ['pending', 'active', 'inactive'],
    note: 'ResourceInstance.status / ConnectionInstance.status — provisioned-resource state.',
  },

  // ── identity-access (the login principal + org structure — the runtime-spine value-sets) ─────────
  // Ported from copafix packages/db/src/_vocabulary.ts (rbac_role / membership_status / invitation_status).
  rbac_role: { type: 'kind', owner: 'identity-access', values: ['admin', 'executive', 'employee'], note: 'coarse access tier on a Membership; fine-grained perms come from RoleAssignment → Role → Permission. admin = the "*" wildcard.' },
  membership_status: { type: 'status', owner: 'identity-access', values: ['active', 'invited', 'suspended'] },
  invitation_status: { type: 'status', owner: 'identity-access', values: ['pending', 'accepted', 'revoked', 'expired'] },

  // ── platform (the provisionable Resource + the Connection type sets — APP_FACTORY.md §4/§5) ──────
  resource_type: {
    type: 'kind', owner: 'platform', open: true,
    values: ['supabaseProject', 'gcpOauthClient', 'vercelProject'],
    note: 'Provisionable Resource types (open — integrations grow). Mirrors platform/src/resources.ts.',
  },
  connection_type: {
    type: 'kind', owner: 'platform', open: true,
    values: ['supabase-keys', 'supabase-admin-token', 'vercel-token', 'gcp-oauth-client',
      'gcp-service-account', 'gcp-org-admin', 'anthropic-api-key', 'github-token'],
    note: 'Known Connection types (open — grows with integrations). Mirrors platform/src/connections.ts.',
  },

  // ── agent-management (the AI layer — agents, their skills/triggers, runs) ──────────────────────
  agent_status: { type: 'status', owner: 'agent-management', values: ['draft', 'active', 'paused', 'archived'] },
  agent_model: { type: 'kind', owner: 'agent-management', open: true, values: ['claude-opus', 'claude-sonnet', 'claude-haiku'], note: 'open — apps pin exact model ids; the LLM call itself is injected (callModel dep)' },
  agent_skill_kind: { type: 'kind', owner: 'agent-management', values: ['workflow', 'function', 'mcp_tool', 'query', 'knowledge'], note: 'the access view — what an agent skill grants (run a workflow / call a function / call a tool / a read query / search a knowledge corpus via the injected retrieve dep)' },
  agent_trigger_type: { type: 'kind', owner: 'agent-management', values: ['manual', 'schedule', 'signal', 'webhook', 'event'], note: 'how an agent fires; schedule carries a cron+tz in config and a computed next_fire_at; event matches a platform signal' },
  agent_run_status: { type: 'status', owner: 'agent-management', values: ['queued', 'running', 'paused', 'completed', 'failed'] },
  agent_run_kind: { type: 'kind', owner: 'agent-management', values: ['turn', 'skill', 'task'], note: 'turn = a model↔tools loop (runAgentTurn); skill = a single granted-skill invocation; task = an ai_agent_task workflow step' },
  agent_run_step_type: { type: 'kind', owner: 'agent-management', values: ['model_call', 'tool_call', 'retrieval', 'guard'], note: 'the per-call audit row inside a run — one model/tool/retrieval/guard call, with tokens + cost + latency' },
  agent_thread_status: { type: 'status', owner: 'agent-management', values: ['open', 'archived'] },
  agent_message_role: { type: 'kind', owner: 'agent-management', values: ['user', 'assistant', 'tool'] },
  agent_response_kind: { type: 'kind', owner: 'agent-management', values: ['answer', 'clarification', 'refusal'], note: 'the discriminant of a structured emit_response (when config.structured_output is on)' },
  agent_knowledge_scope: { type: 'kind', owner: 'agent-management', values: ['shared', 'tenant'], note: 'shared = cross-tenant reference corpus (e.g. SAT/CFDI law; org_id null, readable by all orgs); tenant = per-org private corpus' },
  agent_knowledge_source: { type: 'kind', owner: 'agent-management', open: true, values: ['manual', 'document', 'url', 'system'], note: 'where a knowledge chunk came from (open — sources grow)' },
  agent_channel: { type: 'kind', owner: 'agent-management', open: true, values: ['dashboard_chat', 'whatsapp', 'tecnico_mobile', 'scheduled', 'api'], note: 'the surface a run came through — orients the agent (the context pipeline) + selects delivery; open' },
  agent_channel_binding_status: { type: 'status', owner: 'agent-management', values: ['active', 'disabled'], note: 'an inbound-channel binding (a receiving WhatsApp/SMS address → the agent that answers it)' },
  agent_version_kind: { type: 'kind', owner: 'agent-management', values: ['manual', 'auto_edit', 'pre_restore'], note: 'why a behavior snapshot was taken — manual (with a note), automatically before a behavior edit, or as the safety point before a restore' },
  agent_eval_run_status: { type: 'status', owner: 'agent-management', values: ['running', 'completed', 'failed'] },

  // ── mcp-server (the tool surface — connected servers + the tool registry + invocations) ────────
  mcp_server_status: { type: 'status', owner: 'mcp-server', values: ['connected', 'disconnected', 'error'] },
  mcp_transport: { type: 'kind', owner: 'mcp-server', open: true, values: ['stdio', 'http', 'sse'], note: 'open — MCP transports grow' },
  mcp_tool_category: { type: 'kind', owner: 'mcp-server', open: true, values: ['read', 'write', 'query', 'execute', 'analysis'], note: 'the generic VERB of a tool (the doctrine: a tool is a verb, the atom of the behavior stack); open' },
  mcp_tool_call_status: { type: 'status', owner: 'mcp-server', values: ['pending', 'ok', 'error'] },

  // ────────────────────────────────────────────────────────────────────────────────────────────
  // DOMAIN value-sets — back-ported verbatim from copafix packages/db/src/_vocabulary.ts (Bundle 7).
  // Owned by the domain modules + the chassis + app-local; registered here so module Functions
  // validate them via catalog.schema(name)/catalog.values(name) (the G8 boundary rule).
  // ────────────────────────────────────────────────────────────────────────────────────────────
  // ── facility-spaces ───────────────────────────────────────────────────────────────────────
  space_status: {
    type: 'status', owner: 'facility-spaces',
    // O Ocupada · OL Ocupada limpia · OS Ocupada sucia · S Salida · VS Vacía sucia · VL Vacía limpia
    // Lista (vendible) · FNM Favor de no molestar · OSE Ocupada sin equipaje · OND Ocupada no durmió.
    // FU (Fuera de uso) is a DERIVED display clave (current_block_id != null), never an event status.
    values: ['O', 'OL', 'OS', 'S', 'VS', 'VL', 'Lista', 'FNM', 'OSE', 'OND'],
  },
  location_kind: { type: 'kind', owner: 'facility-spaces', values: ['property', 'floor', 'room', 'area'] },
  status_event_source: { type: 'kind', owner: 'facility-spaces', values: ['recepcion', 'housekeeping', 'mantenimiento', 'sistema', 'feed_ocupacion'] },
  status_reason: {
    type: 'reason', owner: 'facility-spaces', open: true,
    values: ['inspeccion_fallida', 'entrada_mantenimiento', 'limpieza_profunda_vencida', 'discrepancia_resuelta', 'ajuste_recepcion', 'otro'],
  },
  area_operativa: {
    type: 'catalogo', owner: 'facility-spaces',
    values: ['Eléctrica/Mecánica', 'Cocinas', 'Lavandería', 'Albercas y Jacuzzis', 'Bares', 'Taco Paco', 'Almacén General', 'Habitaciones', 'Playa', 'Torres de Enfriamiento'],
  },
  room_type: { type: 'catalogo', owner: 'facility-spaces', open: true, values: ['estandar'], note: 'real census pending client-questions §4' },
  fachada_zone: { type: 'catalogo', owner: 'facility-spaces', open: true, values: ['frente_mar', 'posterior'], note: 'real zoning pending client-questions §5' },

  // ── equipment-maintenance ───────────────────────────────────────────────────────────────────
  // Demo vocabulary verbatim (prioridad/estado/frecuencias) — extended, never renamed (D6/G13).
  prioridad_equipo: { type: 'catalogo', owner: 'equipment-maintenance', open: true, values: ['Prioritario', 'Estándar', 'Secundario'] },
  estado_salud_equipo: { type: 'status', owner: 'equipment-maintenance', open: true, values: ['ok', 'alerta', 'crítico'] },
  estado_registro_activo: { type: 'status', owner: 'equipment-maintenance', values: ['activo', 'inactivo', 'baja'] },
  tipo_activo: { type: 'kind', owner: 'equipment-maintenance', open: true, values: ['equipo', 'equipo_habitacion', 'componente'] },
  // AC Aire acondicionado · PLO Plomería · ELE Electricidad · PIN Pintura (claves del demo; abierto).
  oficio: { type: 'catalogo', owner: 'equipment-maintenance', open: true, values: ['AC', 'PLO', 'ELE', 'PIN'] },
  tipo_medidor: {
    type: 'kind', owner: 'equipment-maintenance', open: true,
    values: ['kwh', 'horas', 'litros', 'm3', 'porcentaje', 'ph', 'cloro_mg_l', 'temperatura_c', 'presion_bar', 'ciclos'],
  },
  fuente_lectura: { type: 'kind', owner: 'equipment-maintenance', open: true, values: ['manual', 'sensor', 'derivada', 'importada'] },
  accion_fuera_de_rango: { type: 'kind', owner: 'equipment-maintenance', values: ['crear_solicitud', 'crear_tarea', 'solo_alerta'] },
  tipo_evento_activo: {
    type: 'kind', owner: 'equipment-maintenance', open: true,
    values: ['instalado', 'servicio', 'reparacion', 'inspeccion', 'garantia', 'alerta', 'retirado', 'reinstalado', 'baja', 'nota'],
  },
  // origen_ot — where a maintenance order came from (the satellite's `source`, distinct from the
  // Task's source_module). Open: app-local hurricane/earthquake programs add their own (§2.4).
  origen_ot: {
    type: 'kind', owner: 'equipment-maintenance', open: true,
    values: ['incidencia', 'preventivo', 'lectura', 'recorrido', 'revision_habitacion', 'evento', 'os_proveedor', 'manual'],
  },
  // frecuencia_preset is OWNED by scheduling-field-service (the recurrence engine); pre-registered
  // here because equipment-maintenance.pm_frequencies references it and scheduling lands later — one
  // vocabulary of frequencies on both sides of syncPmSchedules (D6).
  frecuencia_preset: {
    type: 'catalogo', owner: 'scheduling-field-service',
    values: ['Diario', 'Semanal', 'Quincenal', 'Mensual', 'Trimestral', 'Semestral', 'Anual'],
  },
  // prioridad is OWNED by scheduling-field-service (the Task board's ordering label); pre-registered
  // here because vendor-management (OS) and request-intake reuse it before scheduling lands. Extends
  // the demo's urgente/normal/puede with the SME's critico tier (≤15 min) — extended, never renamed.
  prioridad: { type: 'kind', owner: 'scheduling-field-service', values: ['critico', 'urgente', 'normal', 'puede'] },
  // task_kind OWNED by scheduling-field-service; pre-registered for compliance's spawn_task_kind.
  task_kind: { type: 'kind', owner: 'scheduling-field-service', values: ['ot', 'limpieza', 'inspeccion', 'ronda', 'montaje'] },
  // The shared Task machine (the gravitational center "la tarea"). Extends Rondo's visitStatuses
  // (planned/scheduled/in_progress/completed/skipped/no_access/cancelled/rescheduled) with on_hold + closed.
  task_status: {
    type: 'status', owner: 'scheduling-field-service',
    values: ['planned', 'scheduled', 'in_progress', 'on_hold', 'completed', 'closed', 'skipped', 'no_access', 'cancelled', 'rescheduled'],
  },
  task_hold_reason: {
    type: 'reason', owner: 'scheduling-field-service', open: true,
    values: ['espera_refacciones', 'espera_proveedor', 'huesped_en_habitacion', 'espera_aprobacion', 'falta_herramienta_equipo', 'clima', 'otro'],
  },
  schedule_mode: { type: 'kind', owner: 'scheduling-field-service', values: ['fixed', 'floating'] },
  schedule_rule_status: { type: 'status', owner: 'scheduling-field-service', values: ['draft', 'active', 'paused', 'expired', 'cancelled'] },
  duplicate_suppression: { type: 'kind', owner: 'scheduling-field-service', values: ['off', 'while_open'] },
  target_kind: { type: 'kind', owner: 'scheduling-field-service', values: ['location', 'asset'] },
  assignment_role: { type: 'kind', owner: 'scheduling-field-service', values: ['lead', 'apoyo'] },

  // ── vendor-management ───────────────────────────────────────────────────────────────────────
  // The OS 5 states are the DEMO's machine VERBATIM (recibida→…→completada); cancelada is the one
  // additive edge (E3). Extended, never renamed (D6/G13).
  os_estado: {
    type: 'status', owner: 'vendor-management',
    values: ['recibida', 'compras_solicitadas', 'refacciones_recibidas', 'reparacion_programada', 'completada', 'cancelada'],
  },
  vendor_kind: { type: 'kind', owner: 'vendor-management', values: ['goods', 'service'] },
  categoria_proveedor: {
    type: 'catalogo', owner: 'vendor-management', open: true,
    values: ['elevadores', 'fumigacion', 'seguridad', 'jardineria', 'lavanderia_externa', 'clima_refrigeracion',
      'calderas_gas', 'albercas', 'extintores', 'electrico', 'hidraulico', 'refacciones', 'ferreteria', 'quimicos', 'otros'],
  },
  estado_69b: { type: 'status', owner: 'vendor-management', values: ['sin_revision', 'verificado', 'presunto', 'definitivo'] },
  estado_proveedor: { type: 'status', owner: 'vendor-management', values: ['activo', 'inactivo'] },
  estado_contrato: { type: 'status', owner: 'vendor-management', values: ['borrador', 'activo', 'pausado', 'vencido', 'cancelado'] },

  // ── compliance-certifications (the single vencimientos engine) ────────────────────────────────
  credential_holder_kind: { type: 'kind', owner: 'compliance-certifications', values: ['staff', 'vendor', 'org', 'asset'] },
  credential_status: { type: 'status', owner: 'compliance-certifications', values: ['active', 'expired', 'suspended', 'revoked', 'superseded'] },
  credential_kind: {
    type: 'kind', owner: 'compliance-certifications', open: true,
    values: ['recarga_extintor', 'pipc', 'dictamen_electrico', 'dictamen_gas_lp', 'dictamen_pararrayos',
      'certificado_fumigacion', 'certificado_limpieza_cisterna', 'repse', 'dc3', 'manejo_higienico', 'garantia',
      'licencia_funcionamiento', 'poliza_seguro'],
  },
  obligation_status: { type: 'status', owner: 'compliance-certifications', values: ['draft', 'active', 'suspended', 'retired'] },
  obligation_fulfillment_mode: { type: 'kind', owner: 'compliance-certifications', values: ['schedule_rule', 'direct', 'document_only', 'readings'] },
  obligation_responsible: { type: 'kind', owner: 'compliance-certifications', values: ['interno', 'proveedor'] },
  compliance_domain: {
    type: 'catalogo', owner: 'compliance-certifications',
    values: ['stps', 'ssa', 'scfi', 'sede', 'proteccion_civil', 'conagua', 'municipal', 'interno'],
  },
  compliance_event_kind: { type: 'kind', owner: 'compliance-certifications', values: ['cumplimiento', 'hallazgo', 'renovacion', 'anulacion', 'nota'] },
  compliance_event_result: { type: 'status', owner: 'compliance-certifications', values: ['cumplida', 'cumplida_con_hallazgos', 'no_cumplida'] },
  evidence_kind: { type: 'kind', owner: 'compliance-certifications', values: ['documento', 'foto', 'firma', 'lectura', 'certificado_proveedor'] },
  issued_document_kind: { type: 'kind', owner: 'compliance-certifications', values: ['bitacora_export', 'constancia', 'reporte_cumplimiento'] },
  issued_document_status: { type: 'status', owner: 'compliance-certifications', values: ['issued', 'voided'] },
  expiry_alert_stage: { type: 'status', owner: 'compliance-certifications', values: ['d30', 'd15', 'd7', 'expired'] },

  // ── request-intake (incidencias → OTs) ────────────────────────────────────────────────────────
  request_channel: { type: 'kind', owner: 'request-intake', values: ['web', 'qr_publico', 'telefono', 'staff'] },
  request_kind: { type: 'kind', owner: 'request-intake', values: ['incidencia', 'rush'] },
  request_status: { type: 'status', owner: 'request-intake', values: ['reportada', 'en_triage', 'convertida', 'rechazada'] },
  rejection_reason: { type: 'reason', owner: 'request-intake', values: ['duplicada', 'no_procede', 'informacion_insuficiente', 'resuelta_en_origen'] },
  reporter_department: {
    type: 'catalogo', owner: 'request-intake', open: true,
    values: ['ama_llaves', 'alimentos_bebidas', 'recepcion', 'mantenimiento', 'seguridad', 'direccion'],
  },

  // ── materials-inventory (the Rondo lot/movement pattern) ────────────────────────────────────
  material_kind: { type: 'kind', owner: 'materials-inventory', values: ['refaccion', 'quimico', 'insumo', 'blanco'] },
  material_categoria: {
    type: 'catalogo', owner: 'materials-inventory', open: true,
    values: ['filtros', 'rodamientos', 'electrico', 'plomeria', 'pintura', 'quimico_alberca', 'quimico_lavanderia', 'limpieza', 'papeleria_bano', 'sabanas', 'toallas', 'toallas_alberca', 'cobertores_protectores'],
  },
  unidad_medida: {
    type: 'catalogo', owner: 'materials-inventory', open: true,
    values: ['pieza', 'juego', 'kg', 'g', 'l', 'ml', 'm', 'caja', 'cubeta', 'garrafa', 'm3'],
  },
  lot_status: { type: 'status', owner: 'materials-inventory', values: ['active', 'depleted', 'expired', 'recalled', 'disposed'] },
  movement_kind: { type: 'kind', owner: 'materials-inventory', values: ['recepcion', 'consumo', 'transferencia', 'ajuste', 'baja', 'devolucion'] },
  baja_reason: {
    type: 'reason', owner: 'materials-inventory', open: true,
    values: ['desgaste', 'mancha', 'rotura', 'perdida', 'robo', 'vencido', 'retirado', 'otro'],
  },

  // ── budget-control (the Cadenza/Velada money domain — operational money control, no GL) ──────
  estado_dimension: { type: 'status', owner: 'budget-control', values: ['activo', 'inactivo'] },
  cc_kind: { type: 'kind', owner: 'budget-control', values: ['operado', 'no_distribuido'] },
  estado_presupuesto: { type: 'status', owner: 'budget-control', values: ['borrador', 'activo', 'cerrado', 'cancelado'] },
  semaforo_presupuesto: { type: 'status', owner: 'budget-control', values: ['verde', 'amarillo', 'rojo', 'sin_presupuesto'], note: 'computed output of budgetBurn' },
  banda_temporada: { type: 'catalogo', owner: 'budget-control', values: ['alta', 'media', 'baja'] },

  // ── facturacion (CFDI 4.0 — the fiscal domain, ported from Cadenza) ──────────────────────────
  cfdi_tipo_comprobante: { type: 'kind', owner: 'facturacion', values: ['I', 'E', 'P'], note: 'I Ingreso (factura) · E Egreso (nota de crédito) · P Complemento de pago' },
  cfdi_metodo_pago: { type: 'kind', owner: 'facturacion', values: ['PUE', 'PPD'], note: 'PUE pago en una exhibición · PPD diferido/parcialidades (pide complemento P)' },
  estado_cfdi_emitido: { type: 'status', owner: 'facturacion', values: ['pending', 'stamped', 'cancelled', 'failed'] },
  estado_cfdi_recibido: { type: 'status', owner: 'facturacion', values: ['received', 'validated', 'cancelled', 'rejected'] },
  cfdi_relation_type: { type: 'kind', owner: 'facturacion', values: ['credits', 'pays'], note: 'E→I nota de crédito · P→I complemento de pago' },
  cfdi_motivo_cancelacion: { type: 'catalogo', owner: 'facturacion', values: ['01', '02', '03', '04'], note: 'SAT: 01 con sustitución · 02 sin sustitución · 03 no se realizó · 04 nominativa ligada a global' },

  // ── accounts-payable (cuentas por pagar; the AP domain, ported from copafix) ──────────────────
  bill_status: { type: 'status', owner: 'accounts-payable', values: ['draft', 'open', 'partially_paid', 'paid', 'voided'], note: 'open↔partially_paid↔paid are recomputed from allocations, never written by hand' },
  payment_status: { type: 'status', owner: 'accounts-payable', values: ['pending', 'scheduled', 'completed', 'failed', 'voided'] },
  payment_method: { type: 'kind', owner: 'accounts-payable', open: true, values: ['transferencia', 'cheque', 'efectivo', 'tarjeta', 'otro'], note: 'efectivo > $2,000 MXN = fiscal warning, never block' },
  recurring_frequency: { type: 'kind', owner: 'accounts-payable', values: ['monthly', 'weekly', 'biweekly', 'quarterly', 'annual'] },
  recipient_kind: { type: 'kind', owner: 'accounts-payable', open: true, values: ['location', 'asset', 'task', 'space_block', 'vendor_service_order', 'org'], note: 'polymorphic destinatario — what the spend was FOR' },
  bill_origin: { type: 'kind', owner: 'accounts-payable', open: true, values: ['cfdi_intake', 'manual', 'recurring_template', 'po', 'asset_event'] },

  // ── procurement-purchasing (el ciclo de compra formal; ported from copafix) ───────────────────
  // Reuses scheduling's `prioridad` (no redeclare). three_way_estado is a COMPUTED output of threeWayFlag.
  requisicion_status: { type: 'status', owner: 'procurement-purchasing', values: ['borrador', 'solicitada', 'en_cotizacion', 'en_aprobacion', 'aprobada', 'rechazada', 'con_oc', 'cerrada', 'cancelada'] },
  requisicion_tipo: { type: 'kind', owner: 'procurement-purchasing', values: ['normal', 'capex', 'directa'], note: 'normal · capex (siempre cadena tope) · directa (fast path)' },
  cotizacion_status: { type: 'status', owner: 'procurement-purchasing', values: ['recibida', 'seleccionada', 'descartada'] },
  oc_status: { type: 'status', owner: 'procurement-purchasing', values: ['borrador', 'emitida', 'parcial', 'surtida', 'cerrada', 'cancelada'] },
  regla_alcance: { type: 'kind', owner: 'procurement-purchasing', values: ['general', 'capex'], note: 'general (rutea por monto) · capex (matchea todo kind=capex)' },
  three_way_estado: { type: 'status', owner: 'procurement-purchasing', values: ['ok', 'advertencia', 'discrepancia', 'incompleto'], note: 'computed output of threeWayFlag: OC ↔ recepción ↔ CFDI' },

  // ── petty-cash (caja chica — fondos fijos, vales, reposición, arqueo; ported from copafix 0022) ──
  estado_fondo: { type: 'status', owner: 'petty-cash', values: ['activo', 'inactivo'] },
  estado_reposicion: { type: 'status', owner: 'petty-cash', values: ['solicitada', 'aprobada', 'rechazada', 'pagada'] },
  estado_vale: { type: 'status', owner: 'petty-cash', values: ['abierto', 'comprobado', 'repuesto', 'cancelado'], note: 'abierto→comprobado→repuesto · {abierto,comprobado}→cancelado' },
  resultado_arqueo: { type: 'status', owner: 'petty-cash', values: ['cuadre', 'faltante', 'sobrante'], note: 'computed output of recordCashCount: counted vs expected' },
  advertencia_deducibilidad: { type: 'kind', owner: 'petty-cash', open: true, values: ['sin_cfdi', 'efectivo_limite', 'categoria_restricta'], note: 'tax warnings as data — never blockers' },

  // ── banking (the cash layer — accounts, the signed ledger, transfers; ported from copafix 0034) ──
  bank_account_kind: { type: 'kind', owner: 'banking', open: true, values: ['checking', 'savings', 'credit-card', 'cash', 'merchant', 'fx', 'line-of-credit', 'loan'] },
  bank_account_class: { type: 'kind', owner: 'banking', values: ['asset', 'liability'], note: 'activo (efectivo en tu poder) · pasivo (deuda)' },
  bank_account_status: { type: 'status', owner: 'banking', values: ['active', 'archived'] },
  bank_transaction_status: { type: 'status', owner: 'banking', values: ['unmatched', 'matched', 'ignored'], note: 'por revisar · conciliada · ignorada' },
  bank_transaction_origin: { type: 'kind', owner: 'banking', open: true, values: ['vendor_payment', 'bank_transfer', 'statement_import', 'manual'] },
  bank_transfer_status: { type: 'status', owner: 'banking', values: ['completed', 'scheduled', 'voided'] },

  // ── fixed-assets (the financial asset register — tracking-only; ported from copafix 0035) ──────
  fixed_asset_status: { type: 'status', owner: 'fixed-assets', values: ['active', 'disposed'], note: 'activo · dado de baja' },
  fixed_asset_disposal_reason: { type: 'reason', owner: 'fixed-assets', open: true, values: ['venta', 'baja', 'robo', 'siniestro', 'donacion', 'otro'] },

  // ── customer-management (the sell-side relationship domain; ported from Rondo) ─────────────────
  customer_type: { type: 'kind', owner: 'customer-management', values: ['residential', 'commercial', 'fleet'], note: 'real shapes — drive UI + pricing: home · fixed sites + RFC · moving assets (truck/container)' },
  customer_status: { type: 'status', owner: 'customer-management', values: ['active', 'inactive'] },

  // ── service-contracts (recurring-service agreements + the recurrence engine; ported from Rondo) ─
  contract_service_type: { type: 'kind', owner: 'service-contracts', open: true, values: ['preventative_commercial', 'preventative_residential', 'truck_fumigation', 'specialty'], note: 'open — service domains vary per app; drives valid materials + required applicator cert' },
  contract_billing_model: { type: 'kind', owner: 'service-contracts', values: ['flat', 'per_unit'], note: 'flat = one price/period · per_unit = price × scope items/cycle' },
  contract_status: { type: 'status', owner: 'service-contracts', values: ['draft', 'active', 'paused', 'expired', 'cancelled'] },
  contract_item_target_kind: { type: 'kind', owner: 'service-contracts', values: ['site', 'asset'], note: 'a scope entry targets a service site OR a moving asset (exactly one)' },

  // ── chassis (system; English value-sets, es-MX labels in the message catalog) ───────────────
  sync_exception_status: { type: 'status', owner: '_chassis', values: ['open', 'resolved', 'dismissed'] },
  sync_exception_reason: { type: 'kind', owner: '_chassis', values: ['stale_transition', 'already_claimed', 'permission_denied', 'validation_failed', 'duplicate_command', 'media_missing', 'unknown_command'] },

  // ── app-local (daily operating costs → the director dashboard, D12) ──────────────────────────
  turno: { type: 'catalogo', owner: 'app-local', values: ['matutino', 'vespertino', 'nocturno'] },
  fuente_costo: { type: 'kind', owner: 'app-local', open: true, values: ['manual', 'derivada'] },
} as const satisfies Record<string, Definition>;

export type CatalogDefinitionName = keyof typeof CATALOG_DEFINITIONS;

/** The catalog Definition registry — the home a module references. */
export const catalog = createRegistry(CATALOG_DEFINITIONS);

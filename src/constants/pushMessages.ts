/*
- File: pushMessages.ts
- Purpose: Punto unico de los titulos/cuerpos de TODAS las notificaciones push de la API. Antes
  cada controller/service escribia el texto a mano en el lugar donde se manda - cambiar una
  palabra significaba buscarla en 10 archivos distintos. Cada mensaje es una funcion (aunque no
  reciba parametros) para que todos se llamen igual en el punto de uso: PushMessages.xxx(...).
  Estilo: español neutro-venezolano, sin voseo argentino (ver feedback del usuario 2026-09-11).
*/

export interface IPushMessage {
  title: string
  body: string
}

export const PushMessages = {
  // ===== Auth =====
  sesionEnOtroDispositivo: (): IPushMessage => ({
    title: 'Se inició sesión en otro dispositivo',
    body: 'Si fuiste tú, no tienes que hacer nada. Si no reconoces este acceso, contáctanos.',
  }),
  usuarioVerificado: (): IPushMessage => ({
    title: 'Usuario verificado',
    body: 'Tu usuario ha sido verificado',
  }),
  usuarioActivado: (): IPushMessage => ({
    title: 'Usuario activado',
    body: 'Ya puedes comenzar a usar DAI, te esperamos',
  }),
  solicitudRechazada: (pReason?: string | null): IPushMessage => ({
    title: 'Tu solicitud ha sido rechazada',
    body: `${pReason ? pReason + '. ' : ''}Verifica tu información e inténtalo de nuevo.`,
  }),
  verificacionExitosa: (): IPushMessage => ({
    title: 'Tu verificación ha sido exitosa',
    body: 'Iniciemos juntos este viaje. ¡Eso es DAI!',
  }),
  nuevoCandidatoConductor: (): IPushMessage => ({
    title: 'Hay un nuevo candidato para conductor.',
    body: 'Por favor recuerda verificarlo. ¡Eso es DAI!',
  }),
  candidatoConductorEditoInfo: (pName?: string | null): IPushMessage => ({
    title: `${pName || 'Un candidato'} editó su información`,
    body: 'Por favor recuerda verificarlo. ¡Eso es DAI!',
  }),
  nuevaTiendaRegistrada: (pStoreName?: string | null): IPushMessage => ({
    title: 'Nueva tienda registrada',
    body: `${pStoreName || 'Un nuevo comercio'} se registró y espera aprobación.`,
  }),

  // ===== Suspension de conductores =====
  cuentaSuspendida: (pReason: string, pUntil: string): IPushMessage => ({
    title: '¡Tu cuenta ha sido suspendida!',
    body: `${pReason}, hasta: ${pUntil}. Contacta a un operador para aclarar tus dudas.`,
  }),
  cuentaHabilitada: (): IPushMessage => ({
    title: '¡Tu cuenta ha sido habilitada!',
    body: 'Ya puedes trabajar con nosotros nuevamente. ¡Eso es DAI!',
  }),

  // ===== Recargas =====
  recargasPendientesPorAprobar: (): IPushMessage => ({
    title: 'Tienes recargas pendientes por aprobar.',
    body: 'Por favor, recuerda revisarlas. ¡Eso es DAI!',
  }),
  nuevaRecargaPendiente: (pUserName?: string | null): IPushMessage => ({
    title: 'Nueva recarga pendiente por aprobar',
    body: `${pUserName || 'Un usuario'} envió un comprobante - revísalo en el panel. ¡Eso es DAI!`,
  }),
  recargaNoAprobada: (): IPushMessage => ({
    title: '¡Tu recarga no fue aprobada!',
    body: 'Verifica e inténtalo de nuevo. ¡Eso es DAI!',
  }),
  recargaAprobada: (): IPushMessage => ({
    title: '¡Tu recarga fue aprobada!',
    body: 'Ya puedes iniciar tus viajes. ¡Eso es DAI!',
  }),

  // ===== Viajes (traslados) =====
  nuevoViajeCerca: (): IPushMessage => ({
    title: 'Nuevo viaje',
    body: 'Un nuevo viaje cerca de ti',
  }),
  precioActualizado: (): IPushMessage => ({
    title: 'El pasajero actualizó el precio',
    body: 'Revisa el nuevo monto del viaje. ¡Eso es DAI!',
  }),
  pasajeroCancelo: (): IPushMessage => ({
    title: 'Tu pasajero ha cancelado el servicio',
    body: '¡Gracias por tu disposición! Es momento de tomar otro viaje',
  }),
  conductorCancelo: (): IPushMessage => ({
    title: 'Tu conductor ha cancelado el servicio',
    body: 'Si tienes alguna duda, contacta a un operador',
  }),
  servicioAnuladoPorAdmin: (): IPushMessage => ({
    title: 'Tu servicio ha sido anulado',
    body: 'Por nuestro administrador. Contáctanos para aclarar dudas.',
  }),
  driverSeleccionado: (pClientName?: string | null): IPushMessage => ({
    title: `${pClientName || 'Un pasajero'} te ha seleccionado como repartidor`,
    body: 'Dirígete al destino. ¡Eso es DAI!',
  }),
  driverEnElSitio: (): IPushMessage => ({
    title: 'Ya llegué',
    body: 'Te estoy esperando',
  }),
  driverEstaCerca: (): IPushMessage => ({
    title: 'Voy llegando',
    body: 'Espérame afuera',
  }),
  viajeFinalizado: (): IPushMessage => ({
    title: 'Actualización de tu viaje',
    body: 'Tu viaje ha finalizado',
  }),
  nuevaOfertaParaCliente: (): IPushMessage => ({
    title: '¡Tienes una oferta!',
    body: 'Confirma para iniciar tu viaje. ¡Eso es DAI!',
  }),

  // ===== Marketplace (pedidos) =====
  nuevoPedidoParaConfirmar: (): IPushMessage => ({
    title: 'Nuevo pedido',
    body: 'Tienes un pedido nuevo por confirmar. ¡Eso es DAI!',
  }),
  pedidoConfirmado: (pPrepTimeMinutes: number): IPushMessage => ({
    title: 'Pedido confirmado',
    body: `El comercio está preparando tu pedido - estará listo en ~${pPrepTimeMinutes} min. ¡Eso es DAI!`,
  }),
  pedidoCanceladoCliente: (pReason?: string | null): IPushMessage => ({
    title: 'Pedido cancelado',
    body: pReason
      ? `El comercio canceló tu pedido: ${pReason}`
      : 'El comercio canceló tu pedido. Si tienes dudas, contáctanos.',
  }),
  pedidoCanceladoDriver: (): IPushMessage => ({
    title: 'Pedido cancelado',
    body: 'El comercio canceló un pedido que tenías asignado. Ya estás disponible para otro.',
  }),
  repartidorEnCamino: (): IPushMessage => ({
    title: 'Repartidor en camino',
    body: 'Un repartidor tomó tu pedido y va para el comercio. ¡Eso es DAI!',
  }),
  pedidoEnCamino: (): IPushMessage => ({
    title: 'Tu pedido va en camino',
    body: 'El repartidor ya recogió tu pedido y va para allá. ¡Eso es DAI!',
  }),
  pedidoEntregado: (): IPushMessage => ({
    title: 'Pedido entregado',
    body: 'Tu pedido fue entregado. ¡Gracias por usar DAI!',
  }),
  nuevoPedidoParaRepartir: (pStoreName?: string | null): IPushMessage => ({
    title: 'Nuevo pedido para repartir',
    body: `${pStoreName || 'Un comercio'} tiene un pedido listo. ¡Eso es DAI!`,
  }),
  pedidoCanceladoPorClienteSinPagar: (): IPushMessage => ({
    title: 'Pedido cancelado',
    body: 'El cliente canceló el pedido antes de que lo confirmaras.',
  }),
  solicitudCancelacionRecibida: (): IPushMessage => ({
    title: 'Solicitud de cancelación',
    body: 'El cliente pidió cancelar un pedido ya confirmado. Revísalo en el panel para aceptar o rechazar.',
  }),
  solicitudCancelacionAceptada: (): IPushMessage => ({
    title: 'Tu solicitud fue aceptada',
    body: 'La tienda va a coordinar contigo el reembolso por mensaje o llamada.',
  }),
  solicitudCancelacionRechazada: (): IPushMessage => ({
    title: 'Tu solicitud fue rechazada',
    body: 'Tu pedido sigue en curso con normalidad.',
  }),
  // La tienda marco el pedido como listo ANTES de que se cumpliera el tiempo estimado (Italo,
  // 2026-09-18: "puede ser que lo tengan listo en menos tiempo, y no esta bien que esperen").
  pedidoListoParaRecoger: (): IPushMessage => ({
    title: 'Pedido listo',
    body: 'El comercio ya tiene el pedido listo para que lo recojas. ¡Eso es DAI!',
  }),
  recordatorioPedidoSinAtender: (pMinutos: number): IPushMessage => ({
    title: 'Pedido esperando',
    body: `Tienes un pedido sin atender hace ${pMinutos} minutos. Revísalo en el panel.`,
  }),
  recordatorioSolicitudCancelacionSinAtender: (pMinutos: number): IPushMessage => ({
    title: 'Solicitud de cancelación esperando',
    body: `Hay una solicitud de cancelación sin resolver hace ${pMinutos} minutos.`,
  }),
  recordatorioTiempoPorCumplirTienda: (): IPushMessage => ({
    title: 'El tiempo está por cumplirse',
    body: 'Un pedido está por llegar al tiempo estimado de preparación. Marcalo como listo si ya terminó.',
  }),
  recordatorioTiempoPorCumplirConductor: (): IPushMessage => ({
    title: 'El pedido estará listo pronto',
    body: 'El pedido que vas a recoger está por cumplir su tiempo estimado de preparación.',
  }),
}

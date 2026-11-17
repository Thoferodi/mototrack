/**
 * Genera un enlace de WhatsApp formateado con un mensaje amigable para el cliente.
 */
export function buildWhatsAppLink(
  phone: string,
  customerName: string,
  plate: string,
  workshopName: string,
  trackingUrl: string,
  statusText: string
): string {
  // Limpiar el número de teléfono (solo dígitos)
  const cleanPhone = phone.replace(/\D/g, '')

  // Construir el mensaje amigable en texto plano
  const message = `Hola *${customerName}*, te saludamos de *${workshopName}*. 🏍️\n\nTu motocicleta con placa *${plate}* ha actualizado su estado a: *${statusText}*.\n\nPuedes revisar el estado en tiempo real, fotos y aprobar presupuestos en el siguiente enlace:\n${trackingUrl}\n\n¡Gracias por confiar en nosotros!`

  // Retornar URL codificada
  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`
}

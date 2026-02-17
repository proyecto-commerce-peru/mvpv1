export function computeAvailable(qtyOnHand: number, qtyReserved: number): number {
  return qtyOnHand - qtyReserved;
}
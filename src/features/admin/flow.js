// অর্ডারের বৈধ স্ট্যাটাস পরিবর্তন
export const ORDER_FLOW = {
  pending: ['confirmed', 'cancelled'],
  confirmed: ['shipped', 'cancelled'],
  shipped: ['delivered', 'cancelled'],
  delivered: [],
  cancelled: [],
};

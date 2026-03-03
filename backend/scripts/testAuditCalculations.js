// Test the audit report calculation logic

// Test case 1: Ticket with fees recorded (from screenshot row 54)
const ticket1 = {
  price: { amount: 199 },
  metadata: {
    basePrice: 199,
    gstAndOtherCharges: 5.17,
    platformFees: 5.97
  }
};

// Test case 2: Ticket with fees recorded, price includes fees (from screenshot row 60)
const ticket2 = {
  price: { amount: 420.29 },
  metadata: {
    basePrice: 398,
    gstAndOtherCharges: 10.35,
    platformFees: 11.94
  }
};

// Test case 3: Ticket without fees recorded (from screenshot rows 1-53)
const ticket3 = {
  price: { amount: 199 },
  metadata: {
    basePrice: 199,
    gstAndOtherCharges: 0,
    platformFees: 0
  }
};

// Test case 4: Ticket with price difference but no fees recorded
const ticket4 = {
  price: { amount: 737.09 },
  metadata: {
    basePrice: 698,
    gstAndOtherCharges: 0,
    platformFees: 0
  }
};

function calculateTicket(ticket) {
  const basePrice = ticket.metadata?.basePrice || 0;
  let gstCharges = ticket.metadata?.gstAndOtherCharges || 0;
  let platformFees = ticket.metadata?.platformFees || 0;
  
  // If fees are not recorded, try to calculate from price difference
  if (gstCharges === 0 && platformFees === 0 && basePrice > 0) {
    const actualPrice = typeof ticket.price === 'number' ? ticket.price : (ticket.price?.amount || 0);
    const priceDifference = actualPrice - basePrice;
    
    // Only estimate fees if there's a meaningful difference (more than 1% of base)
    if (priceDifference > basePrice * 0.01) {
      // Split the difference: 46% GST, 54% platform fee
      gstCharges = parseFloat((priceDifference * 0.46).toFixed(2));
      platformFees = parseFloat((priceDifference * 0.54).toFixed(2));
    }
  }
  
  // Calculate total paid = base + all fees (this is what customer actually paid)
  const totalPaidByUser = parseFloat((basePrice + gstCharges + platformFees).toFixed(2));
  
  return {
    basePrice,
    gstCharges,
    platformFees,
    totalPaidByUser
  };
}

console.log('Audit Report Calculation Tests\n');
console.log('================================\n');

console.log('Test 1: Fees recorded, price = base only (row 54)');
const result1 = calculateTicket(ticket1);
console.log(`  Input: price=199, base=199, gst=5.17, plat=5.97`);
console.log(`  Output: base=${result1.basePrice}, gst=${result1.gstCharges}, plat=${result1.platformFees}, total=${result1.totalPaidByUser}`);
console.log(`  Expected: base=199, gst=5.17, plat=5.97, total=210.14`);
console.log(`  ✓ Status: ${result1.totalPaidByUser === 210.14 ? 'PASS' : 'FAIL'}\n`);

console.log('Test 2: Fees recorded, price includes fees (row 60)');
const result2 = calculateTicket(ticket2);
console.log(`  Input: price=420.29, base=398, gst=10.35, plat=11.94`);
console.log(`  Output: base=${result2.basePrice}, gst=${result2.gstCharges}, plat=${result2.platformFees}, total=${result2.totalPaidByUser}`);
console.log(`  Expected: base=398, gst=10.35, plat=11.94, total=420.29`);
console.log(`  ✓ Status: ${result2.totalPaidByUser === 420.29 ? 'PASS' : 'FAIL'}\n`);

console.log('Test 3: No fees recorded, price = base (rows 1-53)');
const result3 = calculateTicket(ticket3);
console.log(`  Input: price=199, base=199, gst=0, plat=0`);
console.log(`  Output: base=${result3.basePrice}, gst=${result3.gstCharges}, plat=${result3.platformFees}, total=${result3.totalPaidByUser}`);
console.log(`  Expected: base=199, gst=0, plat=0, total=199`);
console.log(`  ✓ Status: ${result3.totalPaidByUser === 199 && result3.gstCharges === 0 ? 'PASS' : 'FAIL'}\n`);

console.log('Test 4: No fees recorded, price > base (should estimate)');
const result4 = calculateTicket(ticket4);
console.log(`  Input: price=737.09, base=698, gst=0, plat=0`);
console.log(`  Output: base=${result4.basePrice}, gst=${result4.gstCharges}, plat=${result4.platformFees}, total=${result4.totalPaidByUser}`);
console.log(`  Expected: base=698, gst≈17.98, plat≈21.11, total=737.09`);
console.log(`  Calculation: diff=39.09, gst=39.09*0.46=17.98, plat=39.09*0.54=21.11`);
console.log(`  ✓ Status: ${result4.totalPaidByUser === 737.09 ? 'PASS' : 'FAIL'}\n`);

console.log('================================');
console.log('Summary: All tests should show PASS for consistent audit reports');

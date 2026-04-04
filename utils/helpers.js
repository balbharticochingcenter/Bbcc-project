function getSessionEndDate(startDate) {
    const endDate = new Date(startDate);
    endDate.setFullYear(endDate.getFullYear() + 1);
    endDate.setMonth(2); // March
    endDate.setDate(7);
    endDate.setHours(23, 59, 59, 999);
    return endDate;
}

function getSessionName(startDate, endDate) {
    return `${startDate.getFullYear()}-${endDate.getFullYear()}`;
}

function calculateProRatedFees(monthlyFees, monthDate, joinDate, sessionEndDate) {
    const monthStart = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
    const monthEnd = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0);
    
    if (monthEnd < joinDate) return 0;
    if (monthStart > sessionEndDate) return 0;
    
    const effectiveStart = monthStart < joinDate ? joinDate : monthStart;
    const effectiveEnd = monthEnd > sessionEndDate ? sessionEndDate : monthEnd;
    
    const daysInMonth = monthEnd.getDate();
    const effectiveDays = Math.ceil((effectiveEnd - effectiveStart) / (1000 * 60 * 60 * 24)) + 1;
    const proRatedFees = (monthlyFees / daysInMonth) * effectiveDays;
    
    return Math.round(proRatedFees * 100) / 100;
}

function generateFeesHistory(joiningDate, monthlyFees, sessionEndDate) {
    const feesHistory = [];
    const sessionName = getSessionName(joiningDate, sessionEndDate);
    let currentDate = new Date(joiningDate.getFullYear(), joiningDate.getMonth(), 1);
    
    while (currentDate <= sessionEndDate) {
        const monthName = currentDate.toLocaleString('default', { month: 'short' });
        const year = currentDate.getFullYear();
        const monthIndex = currentDate.getMonth();
        
        const amount = calculateProRatedFees(monthlyFees, currentDate, joiningDate, sessionEndDate);
        
        if (amount > 0) {
            feesHistory.push({
                sessionName: sessionName,
                month: monthName,
                year: year,
                monthIndex: monthIndex,
                amount: amount,
                paidAmount: 0,
                dueAmount: amount,
                status: 'unpaid',
                remarks: amount < monthlyFees ? `Pro-rated fees (joined on ${joiningDate.toLocaleDateString()})` : ''
            });
        }
        currentDate.setMonth(currentDate.getMonth() + 1);
    }
    return feesHistory;
}

module.exports = {
    getSessionEndDate,
    getSessionName,
    calculateProRatedFees,
    generateFeesHistory
};

// Get session end date (March 7 of next year)
function getSessionEndDate(startDate) {
    const endDate = new Date(startDate);
    endDate.setFullYear(endDate.getFullYear() + 1);
    endDate.setMonth(2); // March
    endDate.setDate(7);
    return endDate;
}

// Get session name
function getSessionName(startDate, endDate) {
    return `${startDate.getFullYear()}-${endDate.getFullYear()}`;
}

// Calculate pro-rated fees
function calculateProRatedFees(monthlyFees, monthDate, joinDate, sessionEndDate) {
    const monthStart = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
    const monthEnd = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0);
    
    if (monthEnd < joinDate) return 0;
    if (monthStart > sessionEndDate) return 0;
    
    const effectiveStart = monthStart < joinDate ? joinDate : monthStart;
    const effectiveEnd = monthEnd > sessionEndDate ? sessionEndDate : monthEnd;
    
    const daysInMonth = monthEnd.getDate();
    const effectiveDays = Math.ceil((effectiveEnd - effectiveStart) / (1000 * 60 * 60 * 24)) + 1;
    return Math.round((monthlyFees / daysInMonth) * effectiveDays * 100) / 100;
}

// Generate fees history
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
                remarks: ''
            });
        }
        currentDate.setMonth(currentDate.getMonth() + 1);
    }
    return feesHistory;
}

// Check auto block
function shouldAutoBlock(student) {
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    const currentSession = student.currentSession?.sessionName;
    
    const currentMonthFee = student.feesHistory?.find(f => 
        f.monthIndex === currentMonth && f.year === currentYear && f.sessionName === currentSession
    );
    
    const prevMonthFee = student.feesHistory?.find(f => 
        f.monthIndex === currentMonth - 1 && f.year === currentYear && f.sessionName === currentSession
    );
    
    if (prevMonthFee?.status === 'unpaid' && currentMonthFee?.status === 'unpaid') {
        return { shouldBlock: true, reason: '2 months fees due' };
    }
    return { shouldBlock: false };
}

module.exports = {
    getSessionEndDate,
    getSessionName,
    calculateProRatedFees,
    generateFeesHistory,
    shouldAutoBlock
};

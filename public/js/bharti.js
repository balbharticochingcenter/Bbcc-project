// ============================================
// BHARTI AI - Universal Assistant
// Pure JavaScript - No HTML tags
// ============================================

class BhartiAI {
    constructor() {
        this.isLoggedIn = false;
        this.userRole = null;
        this.userToken = null;
        this.userName = null;
        this.userId = null;
        this.pendingAction = null;
        this.regStep = 0;
        this.regData = {};
        this.init();
    }
    
    init() {
        this.createUI();
        this.loadSession();
        this.addWelcome();
    }
    
    createUI() {
        // Button
        const btn = document.createElement('div');
        btn.id = 'bhartiBtn';
        btn.innerHTML = '🤖';
        btn.style.cssText = 'position:fixed;bottom:25px;right:25px;width:60px;height:60px;border-radius:50%;background:linear-gradient(135deg,#4361ee,#7209b7);color:white;font-size:30px;display:flex;align-items:center;justify-content:center;cursor:pointer;z-index:10000;box-shadow:0 5px 20px rgba(0,0,0,0.3);';
        document.body.appendChild(btn);
        
        // Modal
        const modal = document.createElement('div');
        modal.id = 'bhartiModal';
        modal.style.cssText = 'position:fixed;bottom:95px;right:25px;width:380px;height:550px;background:white;border-radius:20px;box-shadow:0 20px 50px rgba(0,0,0,0.2);z-index:10001;display:none;flex-direction:column;overflow:hidden;font-family:system-ui;';
        
        modal.innerHTML = '<div style="background:linear-gradient(135deg,#4361ee,#7209b7);padding:15px;color:white;"><div style="display:flex;justify-content:space-between;"><div><strong style="font-size:18px;">🤖 Bharti AI</strong><div id="bhartiStatus" style="font-size:10px;"></div></div><button id="bhartiCloseBtn" style="background:none;border:none;color:white;font-size:22px;cursor:pointer;">✕</button></div></div><div id="bhartiMessages" style="flex:1;overflow-y:auto;padding:15px;background:#f8fafc;"></div><div id="bhartiInputArea" style="padding:15px;border-top:1px solid #e2e8f0;background:white;"></div>';
        
        document.body.appendChild(modal);
        
        this.btn = document.getElementById('bhartiBtn');
        this.modal = document.getElementById('bhartiModal');
        this.closeBtn = document.getElementById('bhartiCloseBtn');
        this.messagesDiv = document.getElementById('bhartiMessages');
        this.inputArea = document.getElementById('bhartiInputArea');
        this.statusSpan = document.getElementById('bhartiStatus');
        
        this.btn.onclick = () => this.toggle();
        this.closeBtn.onclick = () => this.close();
    }
    
    toggle() {
        if (this.modal.style.display === 'flex') {
            this.modal.style.display = 'none';
        } else {
            this.modal.style.display = 'flex';
            this.updateUI();
        }
    }
    
    close() {
        this.modal.style.display = 'none';
    }
    
    loadSession() {
        this.userToken = localStorage.getItem('bharti_token');
        this.userRole = localStorage.getItem('bharti_role');
        this.userName = localStorage.getItem('bharti_name');
        this.userId = localStorage.getItem('bharti_id');
        this.isLoggedIn = !!this.userToken;
    }
    
    updateUI() {
        if (this.isLoggedIn) {
            this.statusSpan.innerHTML = '✅ ' + this.userRole + ' | ' + this.userName;
            this.showCommandMode();
        } else {
            this.statusSpan.innerHTML = '🔐 Not logged in';
            this.showAuthMode();
        }
    }
    
    showAuthMode() {
        this.inputArea.innerHTML = '<div><select id="bhartiRoleSelect" style="width:100%;padding:10px;border-radius:10px;border:1px solid #e2e8f0;margin-bottom:10px;"><option value="admin">👨‍💼 Admin Login</option><option value="teacher">👨‍🏫 Teacher Login</option><option value="student">👨‍🎓 Student Login</option><option value="register">📝 New Student? Register</option><option value="teacher_reg">👨‍🏫 New Teacher? Register</option></select><div id="bhartiLoginFields"></div></div>';
        
        const roleSelect = document.getElementById('bhartiRoleSelect');
        const loginFields = document.getElementById('bhartiLoginFields');
        
        const updateFields = () => {
            const role = roleSelect.value;
            if (role === 'admin') {
                loginFields.innerHTML = '<input type="text" id="bhartiUserId" placeholder="Admin ID" style="width:100%;padding:10px;border-radius:10px;border:1px solid #e2e8f0;margin-bottom:8px;"><input type="password" id="bhartiPassword" placeholder="Password" style="width:100%;padding:10px;border-radius:10px;border:1px solid #e2e8f0;margin-bottom:8px;"><button id="bhartiLoginAction" style="width:100%;padding:10px;background:linear-gradient(135deg,#4361ee,#7209b7);border:none;border-radius:10px;color:white;font-weight:bold;cursor:pointer;">Login</button>';
            } else if (role === 'teacher') {
                loginFields.innerHTML = '<div><button id="teacherIdLoginBtn" style="width:48%;padding:8px;background:#4361ee;border:none;border-radius:8px;color:white;">ID+Password</button><button id="teacherAadharLoginBtn" style="width:48%;padding:8px;background:#64748b;border:none;border-radius:8px;color:white;">Aadhar+DOB</button></div><div id="teacherLoginForm"></div>';
                document.getElementById('teacherIdLoginBtn').onclick = () => {
                    document.getElementById('teacherLoginForm').innerHTML = '<input type="text" id="bhartiUserId" placeholder="Teacher ID" style="width:100%;padding:10px;border-radius:10px;border:1px solid #e2e8f0;margin-bottom:8px;"><input type="password" id="bhartiPassword" placeholder="Password" style="width:100%;padding:10px;border-radius:10px;border:1px solid #e2e8f0;margin-bottom:8px;"><button id="bhartiLoginAction" style="width:100%;padding:10px;background:linear-gradient(135deg,#4361ee,#7209b7);border:none;border-radius:10px;color:white;cursor:pointer;">Login</button>';
                    document.getElementById('bhartiLoginAction').onclick = () => this.teacherLogin('id');
                };
                document.getElementById('teacherAadharLoginBtn').onclick = () => {
                    document.getElementById('teacherLoginForm').innerHTML = '<input type="text" id="bhartiAadhar" placeholder="Aadhar Number" style="width:100%;padding:10px;border-radius:10px;border:1px solid #e2e8f0;margin-bottom:8px;"><input type="date" id="bhartiDob" style="width:100%;padding:10px;border-radius:10px;border:1px solid #e2e8f0;margin-bottom:8px;"><button id="bhartiLoginAction" style="width:100%;padding:10px;background:linear-gradient(135deg,#4361ee,#7209b7);border:none;border-radius:10px;color:white;cursor:pointer;">Login</button>';
                    document.getElementById('bhartiLoginAction').onclick = () => this.teacherLogin('aadhar');
                };
                document.getElementById('teacherIdLoginBtn').click();
            } else if (role === 'student') {
                loginFields.innerHTML = '<input type="text" id="bhartiUserId" placeholder="Student ID" style="width:100%;padding:10px;border-radius:10px;border:1px solid #e2e8f0;margin-bottom:8px;"><input type="password" id="bhartiPassword" placeholder="Password" style="width:100%;padding:10px;border-radius:10px;border:1px solid #e2e8f0;margin-bottom:8px;"><button id="bhartiLoginAction" style="width:100%;padding:10px;background:linear-gradient(135deg,#4361ee,#7209b7);border:none;border-radius:10px;color:white;font-weight:bold;cursor:pointer;">Login</button>';
            } else if (role === 'register') {
                loginFields.innerHTML = '<button id="startStudentReg" style="width:100%;padding:12px;background:linear-gradient(135deg,#00b09b,#96c93d);border:none;border-radius:10px;color:white;font-weight:bold;cursor:pointer;">📝 Start Student Registration</button>';
                document.getElementById('startStudentReg').onclick = () => this.startStudentRegistration();
            } else if (role === 'teacher_reg') {
                loginFields.innerHTML = '<button id="startTeacherReg" style="width:100%;padding:12px;background:linear-gradient(135deg,#f59e0b,#d97706);border:none;border-radius:10px;color:white;font-weight:bold;cursor:pointer;">👨‍🏫 Start Teacher Registration</button>';
                document.getElementById('startTeacherReg').onclick = () => this.startTeacherRegistration();
            }
            
            const actionBtn = document.getElementById('bhartiLoginAction');
            if (actionBtn && role !== 'teacher' && role !== 'register' && role !== 'teacher_reg') {
                actionBtn.onclick = () => this.handleLogin(role);
            }
        };
        
        roleSelect.onchange = updateFields;
        updateFields();
    }
    
    showCommandMode() {
        this.inputArea.innerHTML = '<div style="display:flex;gap:8px;"><input type="text" id="bhartiCommand" placeholder="Ask me anything..." style="flex:1;padding:10px;border-radius:20px;border:1px solid #e2e8f0;"><button id="bhartiSend" style="width:44px;height:44px;border-radius:50%;background:linear-gradient(135deg,#4361ee,#7209b7);border:none;color:white;cursor:pointer;">➤</button></div><div id="bhartiSuggestions" style="display:flex;flex-wrap:wrap;gap:6px;margin-top:10px;"></div><button id="bhartiLogout" style="width:100%;margin-top:10px;padding:8px;background:#ef4444;border:none;border-radius:8px;color:white;cursor:pointer;">Logout</button>';
        
        this.commandInput = document.getElementById('bhartiCommand');
        this.sendBtn = document.getElementById('bhartiSend');
        this.logoutBtn = document.getElementById('bhartiLogout');
        
        this.sendBtn.onclick = () => this.processCommand();
        this.commandInput.onkeypress = (e) => { if (e.key === 'Enter') this.processCommand(); };
        this.logoutBtn.onclick = () => this.logout();
        this.updateSuggestions();
    }
    
    updateSuggestions() {
        const suggestionsDiv = document.getElementById('bhartiSuggestions');
        let suggestions = [];
        if (this.userRole === 'admin') {
            suggestions = ['📋 Show all students', '👨‍🏫 Show all teachers', '⏳ Pending teachers', '📊 Dashboard stats'];
        } else if (this.userRole === 'teacher') {
            suggestions = ['👨‍🎓 My students', '📸 Mark my attendance', '📋 My attendance'];
        } else if (this.userRole === 'student') {
            suggestions = ['📖 My attendance', '💰 My fees'];
        }
        suggestionsDiv.innerHTML = suggestions.map(s => '<span style="background:#f1f5f9;padding:5px 10px;border-radius:15px;font-size:11px;cursor:pointer;" onclick="window.bharti.setCommand(\'' + s + '\')">' + s + '</span>').join('');
    }
    
    setCommand(cmd) {
        if (this.commandInput) {
            this.commandInput.value = cmd;
            this.processCommand();
        }
    }
    
    async handleLogin(role) {
        const userId = document.getElementById('bhartiUserId')?.value;
        const password = document.getElementById('bhartiPassword')?.value;
        if (!userId || !password) {
            this.addMessage('❌ Please enter both ID and password', 'bot');
            return;
        }
        this.addMessage('Logging in...', 'bot');
        try {
            let response, data;
            if (role === 'admin') {
                response = await fetch('/api/admin-login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ userid: userId, password })
                });
                data = await response.json();
            } else {
                response = await fetch('/api/student-login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ studentId: userId, password })
                });
                data = await response.json();
            }
            if (data.success) {
                this.userToken = data.token;
                this.userRole = role;
                this.userName = data.admin?.name || data.data?.studentName?.first || userId;
                this.userId = userId;
                this.isLoggedIn = true;
                localStorage.setItem('bharti_token', data.token);
                localStorage.setItem('bharti_role', role);
                localStorage.setItem('bharti_name', this.userName);
                localStorage.setItem('bharti_id', userId);
                this.addMessage('✅ Welcome ' + this.userName + '!', 'bot');
                this.updateUI();
            } else {
                this.addMessage('❌ ' + (data.message || 'Login failed'), 'bot');
            }
        } catch (error) {
            this.addMessage('❌ Network error', 'bot');
        }
    }
    
    async teacherLogin(method) {
        if (method === 'id') {
            const teacherId = document.getElementById('bhartiUserId')?.value;
            const password = document.getElementById('bhartiPassword')?.value;
            if (!teacherId || !password) {
                this.addMessage('❌ Please enter Teacher ID and Password', 'bot');
                return;
            }
            try {
                const response = await fetch('/api/teacher-login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ teacherId, password })
                });
                const data = await response.json();
                if (data.success) {
                    this.userToken = data.token;
                    this.userRole = 'teacher';
                    this.userName = data.data?.teacherName?.first || teacherId;
                    this.userId = teacherId;
                    this.isLoggedIn = true;
                    localStorage.setItem('bharti_token', data.token);
                    localStorage.setItem('bharti_role', 'teacher');
                    localStorage.setItem('bharti_name', this.userName);
                    localStorage.setItem('bharti_id', teacherId);
                    this.addMessage('✅ Welcome Teacher ' + this.userName + '!', 'bot');
                    this.updateUI();
                } else {
                    this.addMessage('❌ ' + data.message, 'bot');
                }
            } catch (error) {
                this.addMessage('❌ Network error', 'bot');
            }
        } else {
            const aadhar = document.getElementById('bhartiAadhar')?.value;
            const dob = document.getElementById('bhartiDob')?.value;
            if (!aadhar || !dob) {
                this.addMessage('❌ Please enter Aadhar and DOB', 'bot');
                return;
            }
            try {
                const response = await fetch('/api/teacher-login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ aadharNumber: aadhar, dob })
                });
                const data = await response.json();
                if (data.success) {
                    this.userToken = data.token;
                    this.userRole = 'teacher';
                    this.userName = data.data?.teacherName?.first || 'Teacher';
                    this.userId = data.data?.teacherId;
                    this.isLoggedIn = true;
                    localStorage.setItem('bharti_token', data.token);
                    localStorage.setItem('bharti_role', 'teacher');
                    localStorage.setItem('bharti_name', this.userName);
                    localStorage.setItem('bharti_id', this.userId);
                    this.addMessage('✅ Welcome Teacher ' + this.userName + '!', 'bot');
                    this.updateUI();
                } else {
                    this.addMessage('❌ ' + data.message, 'bot');
                }
            } catch (error) {
                this.addMessage('❌ Network error', 'bot');
            }
        }
    }
    
    startStudentRegistration() {
        this.regStep = 1;
        this.regData = {};
        this.askNextField();
    }
    
    askNextField() {
        const fields = [
            { key: 'studentId', label: 'Student ID', type: 'text' },
            { key: 'password', label: 'Password', type: 'password' },
            { key: 'fullName', label: 'Full Name', type: 'text' },
            { key: 'mobile', label: 'Mobile Number', type: 'tel' },
            { key: 'aadhar', label: 'Aadhar Number', type: 'text' },
            { key: 'board', label: 'Board', type: 'text' },
            { key: 'class', label: 'Class', type: 'text' },
            { key: 'fatherName', label: "Father's Name", type: 'text' },
            { key: 'fatherMobile', label: "Father's Mobile", type: 'tel' },
            { key: 'address', label: 'Address', type: 'text' }
        ];
        if (this.regStep <= fields.length) {
            const field = fields[this.regStep - 1];
            this.showInputForm(field.label, field.type, (value) => {
                if (value) this.regData[field.key] = value;
                this.regStep++;
                this.askNextField();
            });
        } else {
            this.submitStudentRegistration();
        }
    }
    
    startTeacherRegistration() {
        this.regStep = 1;
        this.regData = {};
        this.askTeacherField();
    }
    
    askTeacherField() {
        const fields = [
            { key: 'teacherId', label: 'Teacher ID', type: 'text' },
            { key: 'password', label: 'Password', type: 'password' },
            { key: 'fullName', label: 'Full Name', type: 'text' },
            { key: 'mobile', label: 'Mobile Number', type: 'tel' },
            { key: 'aadhar', label: 'Aadhar Number', type: 'text' },
            { key: 'dob', label: 'Date of Birth', type: 'date' },
            { key: 'qualification', label: 'Qualification', type: 'text' },
            { key: 'subject', label: 'Subject', type: 'text' },
            { key: 'address', label: 'Address', type: 'text' }
        ];
        if (this.regStep <= fields.length) {
            const field = fields[this.regStep - 1];
            this.showInputForm(field.label, field.type, (value) => {
                if (value) this.regData[field.key] = value;
                this.regStep++;
                this.askTeacherField();
            });
        } else {
            this.submitTeacherRegistration();
        }
    }
    
    showInputForm(label, type, callback) {
        this.inputArea.innerHTML = '<div><div style="margin-bottom:10px;font-weight:bold;">' + label + ' *</div><input type="' + type + '" id="bhartiFieldInput" style="width:100%;padding:10px;border-radius:10px;border:1px solid #e2e8f0;margin-bottom:10px;"><button id="bhartiFieldSubmit" style="width:100%;padding:10px;background:linear-gradient(135deg,#4361ee,#7209b7);border:none;border-radius:10px;color:white;cursor:pointer;">Next</button></div>';
        const input = document.getElementById('bhartiFieldInput');
        const submit = document.getElementById('bhartiFieldSubmit');
        submit.onclick = () => {
            const value = input.value.trim();
            if (!value) {
                this.addMessage('❌ ' + label + ' is required!', 'bot');
                return;
            }
            callback(value);
        };
        input.focus();
    }
    
    async submitStudentRegistration() {
        this.addMessage('🔄 Registering...', 'bot');
        const nameParts = this.regData.fullName.split(' ');
        const studentData = {
            studentId: this.regData.studentId,
            password: this.regData.password,
            photo: 'https://via.placeholder.com/100',
            aadhar: this.regData.aadhar,
            aadharDocument: this.regData.aadhar,
            classMonthlyFees: 2000,
            student: { firstName: nameParts[0] || '', middleName: nameParts[1] || '', lastName: nameParts[2] || '' },
            mobile: this.regData.mobile,
            father: { firstName: this.regData.fatherName.split(' ')[0] || '', middleName: '', lastName: '', mobile: this.regData.fatherMobile },
            mother: { firstName: '', middleName: '', lastName: '' },
            address: { current: this.regData.address, permanent: this.regData.address },
            education: { board: this.regData.board, class: this.regData.class },
            dates: { reg: new Date().toISOString(), join: new Date().toISOString() }
        };
        try {
            const response = await fetch('/api/student-register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(studentData)
            });
            const data = await response.json();
            if (data.success) {
                this.addMessage('✅ Registration Successful!\n\nStudent ID: ' + data.studentId + '\nPassword: ' + data.password, 'bot');
                this.regStep = 0;
                this.updateUI();
            } else {
                this.addMessage('❌ Failed: ' + data.message, 'bot');
            }
        } catch (error) {
            this.addMessage('❌ Network error', 'bot');
        }
    }
    
    async submitTeacherRegistration() {
        this.addMessage('🔄 Registering teacher...', 'bot');
        const nameParts = this.regData.fullName.split(' ');
        const teacherData = {
            teacherId: this.regData.teacherId,
            password: this.regData.password,
            photo: 'https://via.placeholder.com/100',
            teacherName: { first: nameParts[0] || '', middle: nameParts[1] || '', last: nameParts[2] || '' },
            mobile: this.regData.mobile,
            dob: this.regData.dob,
            aadharNumber: this.regData.aadhar,
            aadharDoc: this.regData.aadhar,
            lastQualification: this.regData.qualification,
            qualificationDoc: this.regData.qualification,
            subject: this.regData.subject,
            address: { current: this.regData.address, permanent: this.regData.address },
            status: 'pending'
        };
        try {
            const response = await fetch('/api/teacher-register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(teacherData)
            });
            const data = await response.json();
            if (data.success) {
                this.addMessage('✅ Registration Submitted!\n\nTeacher ID: ' + this.regData.teacherId + '\nStatus: Pending Approval', 'bot');
                this.regStep = 0;
                this.updateUI();
            } else {
                this.addMessage('❌ Failed: ' + data.message, 'bot');
            }
        } catch (error) {
            this.addMessage('❌ Network error', 'bot');
        }
    }
    
    async processCommand() {
        const command = this.commandInput.value.trim();
        if (!command) return;
        this.addMessage(command, 'user');
        this.commandInput.value = '';
        const lower = command.toLowerCase();
        if (this.userRole === 'admin') {
            if (lower.includes('show all student')) {
                await this.fetchData('/api/students', 'students');
            } else if (lower.includes('show all teacher')) {
                await this.fetchData('/api/teachers', 'teachers');
            } else if (lower.includes('pending teacher')) {
                await this.showPendingTeachers();
            } else if (lower.includes('dashboard') || lower.includes('stats')) {
                await this.showStats();
            } else {
                this.addMessage('Try: "Show all students", "Show all teachers", "Pending teachers"', 'bot');
            }
        } else if (this.userRole === 'teacher') {
            if (lower.includes('my student')) {
                await this.fetchData('/api/students', 'students');
            } else if (lower.includes('mark my attendance')) {
                await this.markMyAttendance();
            } else if (lower.includes('my attendance')) {
                await this.showMyAttendance();
            } else {
                this.addMessage('Try: "My students", "Mark my attendance", "My attendance"', 'bot');
            }
        } else if (this.userRole === 'student') {
            if (lower.includes('my attendance')) {
                await this.showMyAttendance();
            } else {
                this.addMessage('Try: "My attendance"', 'bot');
            }
        }
    }
    
    async markMyAttendance() {
        const today = new Date().toISOString().split('T')[0];
        try {
            const response = await fetch('/api/teachers/' + this.userId + '/attendance', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + this.userToken },
                body: JSON.stringify({ date: today, status: 'present', remarks: 'Marked via Bharti AI' })
            });
            const data = await response.json();
            if (data.success) {
                this.addMessage('✅ Attendance marked for ' + today + '!', 'bot');
            } else {
                this.addMessage('❌ Failed: ' + data.message, 'bot');
            }
        } catch (error) {
            this.addMessage('❌ Error', 'bot');
        }
    }
    
    async showMyAttendance() {
        try {
            const endpoint = this.userRole === 'teacher' ? '/api/teachers/' + this.userId + '/attendance' : '/api/students/' + this.userId + '/attendance';
            const response = await fetch(endpoint, { headers: { 'Authorization': 'Bearer ' + this.userToken } });
            const data = await response.json();
            if (data.success && data.data) {
                const last5 = data.data.slice(-5);
                if (last5.length === 0) {
                    this.addMessage('No attendance records', 'bot');
                } else {
                    let msg = '📋 Last 5 Days\n\n';
                    last5.forEach(a => { msg += a.date + ': ' + a.status + '\n'; });
                    this.addMessage(msg, 'bot');
                }
            }
        } catch (error) {
            this.addMessage('Error fetching attendance', 'bot');
        }
    }
    
    async fetchData(url, type) {
        try {
            const response = await fetch(url, { headers: { 'Authorization': 'Bearer ' + this.userToken } });
            const data = await response.json();
            if (data.success && data.data) {
                let msg = '📊 ' + data.data.length + ' ' + type.toUpperCase() + '\n\n';
                data.data.slice(0, 5).forEach(item => {
                    if (type === 'students') {
                        msg += '👨‍🎓 ' + item.studentName.first + ' ' + item.studentName.last + '\n   ID: ' + item.studentId + '\n\n';
                    } else if (type === 'teachers') {
                        msg += '👨‍🏫 ' + item.teacherName.first + ' ' + item.teacherName.last + '\n   ID: ' + item.teacherId + '\n\n';
                    }
                });
                this.addMessage(msg, 'bot');
            }
        } catch (error) {
            this.addMessage('Error', 'bot');
        }
    }
    
    async showPendingTeachers() {
        try {
            const response = await fetch('/api/teachers', { headers: { 'Authorization': 'Bearer ' + this.userToken } });
            const data = await response.json();
            const pending = data.data.filter(t => t.status === 'pending');
            if (pending.length === 0) {
                this.addMessage('✅ No pending approvals', 'bot');
            } else {
                let msg = '⏳ ' + pending.length + ' Pending Approvals\n\n';
                pending.forEach(t => { msg += '👤 ' + t.teacherName.first + ' ' + t.teacherName.last + '\n   ID: ' + t.teacherId + '\n\n'; });
                this.addMessage(msg, 'bot');
            }
        } catch (error) {
            this.addMessage('Error', 'bot');
        }
    }
    
    async showStats() {
        try {
            const statsRes = await fetch('/api/stats');
            const stats = await statsRes.json();
            this.addMessage('📈 Dashboard Stats\n\n👨‍🎓 Students: ' + (stats.data?.totalStudents || 0) + '\n👨‍🏫 Teachers: ' + (stats.data?.totalTeachers || 0) + '\n⏳ Pending: ' + (stats.data?.pendingTeachers || 0), 'bot');
        } catch (error) {
            this.addMessage('Error', 'bot');
        }
    }
    
    logout() {
        this.isLoggedIn = false;
        this.userToken = null;
        this.userRole = null;
        localStorage.removeItem('bharti_token');
        localStorage.removeItem('bharti_role');
        localStorage.removeItem('bharti_name');
        localStorage.removeItem('bharti_id');
        this.addMessage('Logged out!', 'bot');
        this.updateUI();
    }
    
    addMessage(text, type) {
        const msgDiv = document.createElement('div');
        msgDiv.style.marginBottom = '12px';
        msgDiv.style.display = 'flex';
        msgDiv.style.justifyContent = type === 'user' ? 'flex-end' : 'flex-start';
        const bubble = document.createElement('div');
        bubble.style.maxWidth = '80%';
        bubble.style.padding = '10px 12px';
        bubble.style.borderRadius = '15px';
        bubble.style.whiteSpace = 'pre-wrap';
        bubble.style.fontSize = '13px';
        if (type === 'user') {
            bubble.style.background = 'linear-gradient(135deg,#4361ee,#7209b7)';
            bubble.style.color = 'white';
        } else {
            bubble.style.background = 'white';
            bubble.style.color = '#1e293b';
            bubble.style.border = '1px solid #e2e8f0';
        }
        bubble.innerHTML = text.replace(/\n/g, '<br>');
        msgDiv.appendChild(bubble);
        this.messagesDiv.appendChild(msgDiv);
        this.messagesDiv.scrollTop = this.messagesDiv.scrollHeight;
    }
    
    addWelcome() {
        setTimeout(() => {
            this.addMessage('👋 Namaste! Main Bharti AI. Login karein ya register karein.', 'bot');
        }, 1000);
    }
}

let bharti;
document.addEventListener('DOMContentLoaded', () => {
    bharti = new BhartiAI();
    window.bharti = bharti;
});

// ============================================
// BHARTI AI - Universal Assistant
// Works on any page, handles all operations
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
        this.attendanceData = {};
        this.init();
    }
    
    init() {
        this.createUI();
        this.loadSession();
        this.bindEvents();
        this.addWelcome();
    }
    
    createUI() {
        // Main button
        const btn = document.createElement('div');
        btn.id = 'bhartiBtn';
        btn.innerHTML = '<i class="fas fa-robot"></i>';
        btn.style.cssText = `
            position: fixed; bottom: 25px; right: 25px;
            width: 60px; height: 60px; border-radius: 50%;
            background: linear-gradient(135deg, #4361ee, #7209b7);
            color: white; font-size: 28px;
            display: flex; align-items: center; justify-content: center;
            cursor: pointer; z-index: 10000;
            box-shadow: 0 5px 20px rgba(0,0,0,0.3);
            transition: all 0.3s;
        `;
        document.body.appendChild(btn);
        
        // Modal
        const modal = document.createElement('div');
        modal.id = 'bhartiModal';
        modal.style.cssText = `
            position: fixed; bottom: 95px; right: 25px;
            width: 400px; height: 600px;
            background: white; border-radius: 20px;
            box-shadow: 0 20px 50px rgba(0,0,0,0.2);
            z-index: 10001;
            display: none;
            flex-direction: column;
            overflow: hidden;
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
        `;
        
        modal.innerHTML = `
            <div style="background: linear-gradient(135deg, #4361ee, #7209b7); padding: 15px; color: white;">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <div>
                        <i class="fas fa-robot"></i> 
                        <strong style="font-size: 18px;"> Bharti AI</strong>
                        <div id="bhartiStatus" style="font-size: 10px; opacity: 0.8;"></div>
                    </div>
                    <button id="bhartiCloseBtn" style="background: none; border: none; color: white; font-size: 22px; cursor: pointer;">✕</button>
                </div>
            </div>
            <div id="bhartiMessages" style="flex: 1; overflow-y: auto; padding: 15px; background: #f8fafc;"></div>
            <div id="bhartiInputArea" style="padding: 15px; border-top: 1px solid #e2e8f0; background: white;"></div>
        `;
        
        document.body.appendChild(modal);
        
        this.btn = document.getElementById('bhartiBtn');
        this.modal = document.getElementById('bhartiModal');
        this.closeBtn = document.getElementById('bhartiCloseBtn');
        this.messagesDiv = document.getElementById('bhartiMessages');
        this.inputArea = document.getElementById('bhartiInputArea');
        this.statusSpan = document.getElementById('bhartiStatus');
        
        this.btn.onclick = () => this.toggle();
        this.closeBtn.onclick = () => this.close();
        
        // Add FontAwesome if not present
        if (!document.querySelector('link[href*="font-awesome"]')) {
            const fa = document.createElement('link');
            fa.rel = 'stylesheet';
            fa.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css';
            document.head.appendChild(fa);
        }
    }
    
    toggle() {
        this.modal.style.display = this.modal.style.display === 'flex' ? 'none' : 'flex';
        if (this.modal.style.display === 'flex') {
            this.updateUI();
            this.scrollToBottom();
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
            this.statusSpan.innerHTML = `✅ ${this.userRole} | ${this.userName}`;
            this.showCommandMode();
        } else {
            this.statusSpan.innerHTML = `🔐 Not logged in`;
            this.showAuthMode();
        }
    }
    
    showAuthMode() {
        this.inputArea.innerHTML = `
            <div style="margin-bottom: 10px;">
                <select id="bhartiRoleSelect" style="width: 100%; padding: 10px; border-radius: 10px; border: 1px solid #e2e8f0; margin-bottom: 10px;">
                    <option value="admin">👨‍💼 Admin Login</option>
                    <option value="teacher">👨‍🏫 Teacher Login</option>
                    <option value="student">👨‍🎓 Student Login</option>
                    <option value="register">📝 New Student? Register</option>
                    <option value="teacher_reg">👨‍🏫 New Teacher? Register</option>
                </select>
                <div id="bhartiLoginFields"></div>
            </div>
        `;
        
        const roleSelect = document.getElementById('bhartiRoleSelect');
        const loginFields = document.getElementById('bhartiLoginFields');
        
        const updateFields = () => {
            const role = roleSelect.value;
            if (role === 'admin') {
                loginFields.innerHTML = `
                    <input type="text" id="bhartiUserId" placeholder="Admin ID" style="width: 100%; padding: 10px; border-radius: 10px; border: 1px solid #e2e8f0; margin-bottom: 8px;">
                    <input type="password" id="bhartiPassword" placeholder="Password" style="width: 100%; padding: 10px; border-radius: 10px; border: 1px solid #e2e8f0; margin-bottom: 8px;">
                    <button id="bhartiLoginAction" style="width: 100%; padding: 10px; background: linear-gradient(135deg, #4361ee, #7209b7); border: none; border-radius: 10px; color: white; font-weight: bold; cursor: pointer;">Login</button>
                `;
            } else if (role === 'teacher') {
                loginFields.innerHTML = `
                    <div style="margin-bottom: 10px;">
                        <button id="teacherIdLoginBtn" style="width: 48%; padding: 8px; background: #4361ee; border: none; border-radius: 8px; color: white; margin-right: 4%;">ID + Password</button>
                        <button id="teacherAadharLoginBtn" style="width: 48%; padding: 8px; background: #64748b; border: none; border-radius: 8px; color: white;">Aadhar + DOB</button>
                    </div>
                    <div id="teacherLoginForm"></div>
                `;
                const idBtn = document.getElementById('teacherIdLoginBtn');
                const aadharBtn = document.getElementById('teacherAadharLoginBtn');
                const teacherForm = document.getElementById('teacherLoginForm');
                
                idBtn.onclick = () => {
                    teacherForm.innerHTML = `
                        <input type="text" id="bhartiUserId" placeholder="Teacher ID" style="width: 100%; padding: 10px; border-radius: 10px; border: 1px solid #e2e8f0; margin-bottom: 8px;">
                        <input type="password" id="bhartiPassword" placeholder="Password" style="width: 100%; padding: 10px; border-radius: 10px; border: 1px solid #e2e8f0; margin-bottom: 8px;">
                        <button id="bhartiLoginAction" style="width: 100%; padding: 10px; background: linear-gradient(135deg, #4361ee, #7209b7); border: none; border-radius: 10px; color: white; font-weight: bold; cursor: pointer;">Login</button>
                    `;
                    document.getElementById('bhartiLoginAction').onclick = () => this.teacherLogin('id');
                };
                aadharBtn.onclick = () => {
                    teacherForm.innerHTML = `
                        <input type="text" id="bhartiAadhar" placeholder="Aadhar Number" style="width: 100%; padding: 10px; border-radius: 10px; border: 1px solid #e2e8f0; margin-bottom: 8px;">
                        <input type="date" id="bhartiDob" placeholder="Date of Birth" style="width: 100%; padding: 10px; border-radius: 10px; border: 1px solid #e2e8f0; margin-bottom: 8px;">
                        <button id="bhartiLoginAction" style="width: 100%; padding: 10px; background: linear-gradient(135deg, #4361ee, #7209b7); border: none; border-radius: 10px; color: white; font-weight: bold; cursor: pointer;">Login</button>
                    `;
                    document.getElementById('bhartiLoginAction').onclick = () => this.teacherLogin('aadhar');
                };
                idBtn.click();
            } else if (role === 'student') {
                loginFields.innerHTML = `
                    <input type="text" id="bhartiUserId" placeholder="Student ID" style="width: 100%; padding: 10px; border-radius: 10px; border: 1px solid #e2e8f0; margin-bottom: 8px;">
                    <input type="password" id="bhartiPassword" placeholder="Password" style="width: 100%; padding: 10px; border-radius: 10px; border: 1px solid #e2e8f0; margin-bottom: 8px;">
                    <button id="bhartiLoginAction" style="width: 100%; padding: 10px; background: linear-gradient(135deg, #4361ee, #7209b7); border: none; border-radius: 10px; color: white; font-weight: bold; cursor: pointer;">Login</button>
                `;
            } else if (role === 'register') {
                loginFields.innerHTML = `
                    <button id="startStudentReg" style="width: 100%; padding: 12px; background: linear-gradient(135deg, #00b09b, #96c93d); border: none; border-radius: 10px; color: white; font-weight: bold; cursor: pointer;">
                        <i class="fas fa-user-graduate"></i> Start Student Registration
                    </button>
                `;
                document.getElementById('startStudentReg').onclick = () => this.startStudentRegistration();
            } else if (role === 'teacher_reg') {
                loginFields.innerHTML = `
                    <button id="startTeacherReg" style="width: 100%; padding: 12px; background: linear-gradient(135deg, #f59e0b, #d97706); border: none; border-radius: 10px; color: white; font-weight: bold; cursor: pointer;">
                        <i class="fas fa-chalkboard-user"></i> Start Teacher Registration
                    </button>
                `;
                document.getElementById('startTeacherReg').onclick = () => this.startTeacherRegistration();
            }
            
            if (role !== 'teacher' && role !== 'register' && role !== 'teacher_reg') {
                const actionBtn = document.getElementById('bhartiLoginAction');
                if (actionBtn) actionBtn.onclick = () => this.handleLogin(role);
            }
        };
        
        roleSelect.onchange = updateFields;
        updateFields();
    }
    
    showCommandMode() {
        this.inputArea.innerHTML = `
            <div style="display: flex; gap: 8px; margin-bottom: 10px;">
                <input type="text" id="bhartiCommand" placeholder="Ask me anything..." style="flex: 1; padding: 10px; border-radius: 20px; border: 1px solid #e2e8f0;">
                <button id="bhartiSend" style="width: 44px; height: 44px; border-radius: 50%; background: linear-gradient(135deg, #4361ee, #7209b7); border: none; color: white; cursor: pointer;">
                    <i class="fas fa-paper-plane"></i>
                </button>
            </div>
            <div id="bhartiSuggestions" style="display: flex; flex-wrap: wrap; gap: 6px;"></div>
            <button id="bhartiLogout" style="width: 100%; margin-top: 10px; padding: 8px; background: #ef4444; border: none; border-radius: 8px; color: white; cursor: pointer;">Logout</button>
        `;
        
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
            suggestions = ['📋 Show all students', '👨‍🏫 Show all teachers', '⏳ Pending teachers', '📊 Dashboard stats', '➕ Add student', '📸 Mark teacher attendance'];
        } else if (this.userRole === 'teacher') {
            suggestions = ['👨‍🎓 My students', '📸 Mark my attendance', '📋 My attendance', '💰 My salary', '🔍 Search student'];
        } else if (this.userRole === 'student') {
            suggestions = ['📖 My attendance', '💰 My fees', '📚 My profile'];
        }
        
        suggestionsDiv.innerHTML = suggestions.map(s => 
            `<span style="background: #f1f5f9; padding: 5px 10px; border-radius: 15px; font-size: 11px; cursor: pointer;" onclick="window.bharti.setCommand('${s}')">${s}</span>`
        ).join('');
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
        
        this.addMessage(`Logging in as ${role}...`, 'bot');
        
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
                
                this.addMessage(`✅ Welcome ${this.userName}! How can I help you?`, 'bot');
                this.updateUI();
            } else {
                this.addMessage(`❌ ${data.message || 'Login failed'}`, 'bot');
            }
        } catch (error) {
            this.addMessage('❌ Network error. Please try again.', 'bot');
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
                    
                    this.addMessage(`✅ Welcome Teacher ${this.userName}!`, 'bot');
                    this.updateUI();
                } else {
                    this.addMessage(`❌ ${data.message}`, 'bot');
                }
            } catch (error) {
                this.addMessage('❌ Network error', 'bot');
            }
        } else {
            const aadhar = document.getElementById('bhartiAadhar')?.value;
            const dob = document.getElementById('bhartiDob')?.value;
            
            if (!aadhar || !dob) {
                this.addMessage('❌ Please enter Aadhar Number and Date of Birth', 'bot');
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
                    
                    this.addMessage(`✅ Welcome Teacher ${this.userName}!`, 'bot');
                    this.updateUI();
                } else {
                    this.addMessage(`❌ ${data.message}`, 'bot');
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
            { key: 'studentId', label: 'Student ID (e.g., S001)', type: 'text' },
            { key: 'password', label: 'Password (min 6 characters)', type: 'password' },
            { key: 'fullName', label: 'Full Name (First Middle Last)', type: 'text' },
            { key: 'mobile', label: 'Mobile Number (10 digits)', type: 'tel' },
            { key: 'aadhar', label: 'Aadhar Number (12 digits)', type: 'text' },
            { key: 'board', label: 'Board (CBSE/ICSE/UP/Bihar/Other)', type: 'text' },
            { key: 'class', label: 'Class (9th/10th/11th/12th)', type: 'text' },
            { key: 'fatherName', label: "Father's Full Name", type: 'text' },
            { key: 'fatherMobile', label: "Father's Mobile Number", type: 'tel' },
            { key: 'address', label: 'Current Address', type: 'text' },
            { key: 'photo', label: 'Photo URL (optional, press Enter to skip)', type: 'text' }
        ];
        
        if (this.regStep <= fields.length) {
            const field = fields[this.regStep - 1];
            this.showInputForm(field.label, field.type, (value) => {
                if (value) this.regData[field.key] = value;
                this.regStep++;
                this.askNextField();
            }, field.key === 'photo');
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
            { key: 'teacherId', label: 'Teacher ID (e.g., T001)', type: 'text' },
            { key: 'password', label: 'Password (min 6 characters)', type: 'password' },
            { key: 'fullName', label: 'Full Name (First Middle Last)', type: 'text' },
            { key: 'mobile', label: 'Mobile Number (10 digits)', type: 'tel' },
            { key: 'altMobile', label: 'Alternate Mobile (optional)', type: 'tel' },
            { key: 'dob', label: 'Date of Birth (YYYY-MM-DD)', type: 'date' },
            { key: 'aadhar', label: 'Aadhar Number (12 digits)', type: 'text' },
            { key: 'qualification', label: 'Last Qualification (e.g., M.Sc B.Ed)', type: 'text' },
            { key: 'subject', label: 'Subject to Teach', type: 'text' },
            { key: 'experience', label: 'Years of Experience', type: 'number' },
            { key: 'address', label: 'Current Address', type: 'text' },
            { key: 'photo', label: 'Photo URL', type: 'text' },
            { key: 'qualificationDoc', label: 'Qualification Document URL', type: 'text' },
            { key: 'aadharDoc', label: 'Aadhar Document URL', type: 'text' }
        ];
        
        if (this.regStep <= fields.length) {
            const field = fields[this.regStep - 1];
            this.showInputForm(field.label, field.type, (value) => {
                if (value) this.regData[field.key] = value;
                this.regStep++;
                this.askTeacherField();
            }, field.key.includes('optional'));
        } else {
            this.submitTeacherRegistration();
        }
    }
    
    showInputForm(label, type, callback, isOptional) {
        this.inputArea.innerHTML = `
            <div style="padding: 10px;">
                <div style="margin-bottom: 10px; font-weight: bold;">${label}${isOptional ? ' (Optional)' : ' *'}</div>
                <input type="${type}" id="bhartiFieldInput" style="width: 100%; padding: 10px; border-radius: 10px; border: 1px solid #e2e8f0; margin-bottom: 10px;">
                <button id="bhartiFieldSubmit" style="width: 100%; padding: 10px; background: linear-gradient(135deg, #4361ee, #7209b7); border: none; border-radius: 10px; color: white; cursor: pointer;">Next</button>
                ${isOptional ? '<button id="bhartiFieldSkip" style="width: 100%; margin-top: 8px; padding: 8px; background: #e2e8f0; border: none; border-radius: 8px; cursor: pointer;">Skip</button>' : ''}
            </div>
        `;
        
        const input = document.getElementById('bhartiFieldInput');
        const submit = document.getElementById('bhartiFieldSubmit');
        const skip = document.getElementById('bhartiFieldSkip');
        
        submit.onclick = () => {
            const value = input.value.trim();
            if (!value && !isOptional) {
                this.addMessage(`❌ ${label} is required!`, 'bot');
                return;
            }
            callback(value);
        };
        
        if (skip) {
            skip.onclick = () => callback('');
        }
        
        if (type === 'date') {
            input.value = new Date().toISOString().split('T')[0];
        }
        
        input.focus();
    }
    
    async submitStudentRegistration() {
        this.addMessage('🔄 Registering student...', 'bot');
        
        const nameParts = this.regData.fullName.split(' ');
        const studentData = {
            studentId: this.regData.studentId,
            password: this.regData.password,
            photo: this.regData.photo || 'https://via.placeholder.com/100',
            aadhar: this.regData.aadhar,
            aadharDocument: this.regData.aadhar,
            classMonthlyFees: this.regData.board === 'CBSE' ? 2500 : 2000,
            student: {
                firstName: nameParts[0] || '',
                middleName: nameParts[1] || '',
                lastName: nameParts[2] || nameParts[1] || ''
            },
            mobile: this.regData.mobile,
            father: {
                firstName: this.regData.fatherName.split(' ')[0] || '',
                middleName: this.regData.fatherName.split(' ')[1] || '',
                lastName: this.regData.fatherName.split(' ')[2] || '',
                mobile: this.regData.fatherMobile
            },
            mother: { firstName: '', middleName: '', lastName: '' },
            address: {
                current: this.regData.address,
                permanent: this.regData.address
            },
            education: {
                board: this.regData.board,
                class: this.regData.class
            },
            dates: {
                reg: new Date().toISOString(),
                join: new Date().toISOString()
            }
        };
        
        try {
            const response = await fetch('/api/student-register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(studentData)
            });
            const data = await response.json();
            
            if (data.success) {
                this.addMessage(`✅ Registration Successful!\n\nStudent ID: ${data.studentId}\nPassword: ${data.password}\n\nPlease save these credentials.`, 'bot');
                this.regStep = 0;
                this.regData = {};
                this.showAuthMode();
            } else {
                this.addMessage(`❌ Registration failed: ${data.message}`, 'bot');
            }
        } catch (error) {
            this.addMessage('❌ Network error. Please try again.', 'bot');
        }
    }
    
    async submitTeacherRegistration() {
        this.addMessage('🔄 Registering teacher...', 'bot');
        
        const nameParts = this.regData.fullName.split(' ');
        const teacherData = {
            teacherId: this.regData.teacherId,
            password: this.regData.password,
            photo: this.regData.photo,
            teacherName: {
                first: nameParts[0] || '',
                middle: nameParts[1] || '',
                last: nameParts[2] || nameParts[1] || ''
            },
            mobile: this.regData.mobile,
            altMobile: this.regData.altMobile || '',
            dob: this.regData.dob,
            aadharNumber: this.regData.aadhar,
            aadharDoc: this.regData.aadharDoc,
            lastQualification: this.regData.qualification,
            qualificationDoc: this.regData.qualificationDoc,
            subject: this.regData.subject,
            experience: parseInt(this.regData.experience) || 0,
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
                this.addMessage(`✅ Teacher Registration Submitted!\n\nTeacher ID: ${this.regData.teacherId}\nStatus: Pending Approval\n\nAdmin will review and approve soon.`, 'bot');
                this.regStep = 0;
                this.regData = {};
                this.showAuthMode();
            } else {
                this.addMessage(`❌ Registration failed: ${data.message}`, 'bot');
            }
        } catch (error) {
            this.addMessage('❌ Network error. Please try again.', 'bot');
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
            } else if (lower.includes('add student')) {
                this.startStudentRegistration();
            } else if (lower.includes('mark teacher attendance') || lower.includes('teacher attendance')) {
                this.startTeacherAttendance();
            } else {
                this.addMessage('Try: "Show all students", "Show all teachers", "Pending teachers", "Dashboard stats", "Add student", "Mark teacher attendance"', 'bot');
            }
        } else if (this.userRole === 'teacher') {
            if (lower.includes('my student')) {
                await this.fetchData('/api/students', 'students');
            } else if (lower.includes('mark my attendance')) {
                this.startMyAttendance();
            } else if (lower.includes('my attendance')) {
                await this.showMyAttendance();
            } else if (lower.includes('my salary')) {
                this.addMessage('💰 Salary details available in teacher dashboard.', 'bot');
            } else {
                this.addMessage('Try: "My students", "Mark my attendance", "My attendance", "My salary"', 'bot');
            }
        } else if (this.userRole === 'student') {
            if (lower.includes('my attendance')) {
                await this.showMyAttendance();
            } else if (lower.includes('my fees')) {
                this.addMessage('💰 Fees details available in student dashboard.', 'bot');
            } else {
                this.addMessage('Try: "My attendance", "My fees"', 'bot');
            }
        }
    }
    
    startTeacherAttendance() {
        this.addMessage('📸 Please take a photo or provide photo URL for attendance', 'bot');
        this.showInputForm('Photo URL', 'text', (photoUrl) => {
            this.markTeacherAttendance(photoUrl);
        }, false);
    }
    
    async markTeacherAttendance(photoUrl) {
        const today = new Date().toISOString().split('T')[0];
        
        try {
            const response = await fetch(`/api/teachers/${this.userId}/attendance`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.userToken}`
                },
                body: JSON.stringify({
                    date: today,
                    status: 'present',
                    photo: photoUrl,
                    remarks: 'Marked by Bharti AI'
                })
            });
            const data = await response.json();
            
            if (data.success) {
                this.addMessage(`✅ Attendance marked for ${today} with photo!`, 'bot');
            } else {
                this.addMessage(`❌ Failed: ${data.message}`, 'bot');
            }
        } catch (error) {
            this.addMessage('❌ Error marking attendance', 'bot');
        }
    }
    
    startMyAttendance() {
        this.addMessage('📸 For attendance, please provide a photo', 'bot');
        this.showInputForm('Photo URL', 'text', (photoUrl) => {
            this.markMyAttendance(photoUrl);
        }, false);
    }
    
    async markMyAttendance(photoUrl) {
        const today = new Date().toISOString().split('T')[0];
        
        try {
            const response = await fetch(`/api/teachers/${this.userId}/attendance`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.userToken}`
                },
                body: JSON.stringify({
                    date: today,
                    status: 'present',
                    photo: photoUrl,
                    remarks: 'Self marked via Bharti AI'
                })
            });
            const data = await response.json();
            
            if (data.success) {
                this.addMessage(`✅ Your attendance for ${today} has been marked!`, 'bot');
            } else {
                this.addMessage(`❌ Failed: ${data.message}`, 'bot');
            }
        } catch (error) {
            this.addMessage('❌ Error marking attendance', 'bot');
        }
    }
    
    async showMyAttendance() {
        try {
            const endpoint = this.userRole === 'teacher' ? `/api/teachers/${this.userId}/attendance` : `/api/students/${this.userId}/attendance`;
            const response = await fetch(endpoint, {
                headers: { 'Authorization': `Bearer ${this.userToken}` }
            });
            const data = await response.json();
            
            if (data.success && data.data) {
                const last7 = data.data.slice(-7);
                if (last7.length === 0) {
                    this.addMessage('📋 No attendance records found.', 'bot');
                } else {
                    let msg = '📋 **Last 7 Days Attendance**\n\n';
                    last7.forEach(a => {
                        const statusIcon = a.status === 'present' ? '✅' : a.status === 'absent' ? '❌' : '⏰';
                        msg += `${statusIcon} ${a.date}: ${a.status}\n`;
                    });
                    this.addMessage(msg, 'bot');
                }
            }
        } catch (error) {
            this.addMessage('Error fetching attendance', 'bot');
        }
    }
    
    async fetchData(url, type) {
        try {
            const response = await fetch(url, {
                headers: { 'Authorization': `Bearer ${this.userToken}` }
            });
            const data = await response.json();
            
            if (data.success && data.data) {
                let msg = `📊 **${data.data.length} ${type}**\n\n`;
                data.data.slice(0, 5).forEach(item => {
                    if (type === 'students') {
                        msg += `👨‍🎓 ${item.studentName.first} ${item.studentName.last}\n`;
                        msg += `   ID: ${item.studentId} | Class: ${item.education?.class}\n\n`;
                    } else if (type === 'teachers') {
                        msg += `👨‍🏫 ${item.teacherName.first} ${item.teacherName.last}\n`;
                        msg += `   ID: ${item.teacherId} | Status: ${item.status}\n\n`;
                    }
                });
                this.addMessage(msg, 'bot');
            }
        } catch (error) {
            this.addMessage('Error fetching data', 'bot');
        }
    }
    
    async showPendingTeachers() {
        try {
            const response = await fetch('/api/teachers', {
                headers: { 'Authorization': `Bearer ${this.userToken}` }
            });
            const data = await response.json();
            const pending = data.data.filter(t => t.status === 'pending');
            
            if (pending.length === 0) {
                this.addMessage('✅ No pending teacher approvals.', 'bot');
            } else {
                let msg = `⏳ **${pending.length} Pending Approvals**\n\n`;
                pending.forEach(t => {
                    msg += `👤 ${t.teacherName.first} ${t.teacherName.last}\n`;
                    msg += `   ID: ${t.teacherId} | 📞 ${t.mobile}\n\n`;
                });
                this.addMessage(msg, 'bot');
            }
        } catch (error) {
            this.addMessage('Error fetching pending teachers', 'bot');
        }
    }
    
    async showStats() {
        try {
            const statsRes = await fetch('/api/stats');
            const stats = await statsRes.json();
            this.addMessage(`📈 **Dashboard Stats**\n\n👨‍🎓 Students: ${stats.data?.totalStudents || 0}\n👨‍🏫 Teachers: ${stats.data?.totalTeachers || 0}\n⏳ Pending: ${stats.data?.pendingTeachers || 0}\n🏆 Success Rate: ${stats.data?.successRate || 96}%`, 'bot');
        } catch (error) {
            this.addMessage('Error fetching stats', 'bot');
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
        this.addMessage('Logged out successfully!', 'bot');
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
            bubble.style.background = 'linear-gradient(135deg, #4361ee, #7209b7)';
            bubble.style.color = 'white';
        } else {
            bubble.style.background = 'white';
            bubble.style.color = '#1e293b';
            bubble.style.border = '1px solid #e2e8f0';
        }
        
        bubble.innerHTML = text.replace(/\n/g, '<br>');
        msgDiv.appendChild(bubble);
        this.messagesDiv.appendChild(msgDiv);
        this.scrollToBottom();
    }
    
    scrollToBottom() {
        this.messagesDiv.scrollTop = this.messagesDiv.scrollHeight;
    }
    
    addWelcome() {
        setTimeout(() => {
            this.addMessage('👋 Namaste! Main Bharti, aapka AI assistant. Login karein ya register karein.', 'bot');
        }, 1000);
    }
}

// Initialize
let bharti;
document.addEventListener('DOMContentLoaded', () => {
    bharti = new BhartiAI();
    window.bharti = bharti;
});
</script>

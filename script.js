    let teacherData = JSON.parse(localStorage.getItem('nativeTeacherData')) || null;
    let students = JSON.parse(localStorage.getItem('nativeStudents')) || [];
    let currentDate = new Date(); 

    const loginScreen = document.getElementById('login-screen');
    const registerScreen = document.getElementById('register-screen');
    const loginForm = document.getElementById('login-form');
    const studentModal = document.getElementById('student-modal');
    const studentForm = document.getElementById('student-form');

    function init() {
      if (teacherData) { showRegisterScreen(); }
    }

    loginForm.addEventListener('submit', function(e) {
      e.preventDefault();
      teacherData = {
        name: document.getElementById('teacher-name').value,
        className: document.getElementById('class-name').value,
        phone: document.getElementById('phone-number').value
      };
      localStorage.setItem('nativeTeacherData', JSON.stringify(teacherData));
      showRegisterScreen();
    });

    function showRegisterScreen() {
      loginScreen.classList.add('hidden');
      registerScreen.classList.remove('hidden');
      document.getElementById('display-class').innerText = teacherData.className;
      document.getElementById('display-teacher').innerText = `Teacher: ${teacherData.name}`;
      renderRegister();
    }

    function renderRegister() {
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth();
      const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
      
      document.getElementById('month-label').innerText = `${monthNames[month]} ${year}`;
      const totalDays = new Date(year, month + 1, 0).getDate();
      const headerRow = document.getElementById('table-headers');
      
      headerRow.innerHTML = `<th>Student Details <br><button class="add-btn" onclick="openModal()">+ Add Row</button></th>`;
      const sundayMap = [];

      for (let day = 1; day <= totalDays; day++) {
        const isSunday = new Date(year, month, day).getDay() === 0;
        sundayMap.push(isSunday);
        headerRow.innerHTML += `<th class="${isSunday ? 'sunday-header' : ''}">${day}</th>`;
      }

      const tableBody = document.getElementById('table-body');
      tableBody.innerHTML = '';

      students.forEach(student => {
        let rowHtml = `<tr><td><strong>${student.name}</strong><br><span style="font-size:0.75rem;color:var(--text-muted)">📞 ${student.phone}</span></td>`;
        for (let day = 1; day <= totalDays; day++) {
          const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          const isChecked = student.attendance && student.attendance[dateKey] ? 'checked' : '';
          
          rowHtml += `
            <td class="${sundayMap[day - 1] ? 'sunday-cell' : ''}">
              <div class="attendance-cell-container">
                <!-- Checkbox -->
                <input type="checkbox" id="cb-${student.id}-${dateKey}" ${isChecked} onchange="handleCheckboxChange(this, ${student.id}, '${dateKey}')">
                
                <!-- Fixed Dynamic Trigger Link -->
                <a id="btn-${student.id}-${dateKey}" href="#" class="send-sms-link" onclick="handleBtnClick(this, ${student.id}, '${dateKey}')">📤</a>
              </div>
            </td>`;
        }
        rowHtml += `</tr>`;
        tableBody.innerHTML += rowHtml;
      });
    }

    // --- Dynamic Text Builder ---
    function getSmsUrl(student, isPresent) {
      const message = isPresent 
        ? `Your child ${student.name} came to school today. Thanks for sending your child!`
        : `Your child ${student.name} did not come to school today. Please send your child properly to school.`;

      const cleanPhone = student.phone.replace(/[\s\-\(\)]/g, '');
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
      const parameterSeparator = isIOS ? '&' : '?';

      return `sms:${cleanPhone}${parameterSeparator}body=${encodeURIComponent(message)}`;
    }

    // --- Fires instantly when box state is updated ---
    function handleCheckboxChange(checkbox, studentId, dateKey) {
      const isChecked = checkbox.checked;
      
      students = students.map(student => {
        if (student.id === studentId) {
          if (!student.attendance) student.attendance = {};
          student.attendance[dateKey] = isChecked;
        }
        return student;
      });
      localStorage.setItem('nativeStudents', JSON.stringify(students));

      const sendBtn = document.getElementById(`btn-${studentId}-${dateKey}`);
      if (sendBtn) {
        const student = students.find(s => s.id === studentId);
        
        // 1. Inject the correctly calculated real-time message text
        sendBtn.href = getSmsUrl(student, isChecked);
        
        // 2. Perform the system click
        sendBtn.click();
      }
    }

    // --- Double Check System reading the checkbox directly on click ---
    function handleBtnClick(anchor, studentId, dateKey) {
      const checkbox = document.getElementById(`cb-${studentId}-${dateKey}`);
      const isLiveChecked = checkbox ? checkbox.checked : false;
      const student = students.find(s => s.id === studentId);
      
      anchor.href = getSmsUrl(student, isLiveChecked);
    }

    function openModal() { studentModal.classList.remove('hidden'); }
    function closeModal() { studentModal.classList.add('hidden'); studentForm.reset(); }

    studentForm.addEventListener('submit', function(e) {
      e.preventDefault();
      const name = document.getElementById('student-name-input').value.trim();
      const phone = document.getElementById('student-phone-input').value.trim();
      if (name && phone) {
        students.push({ id: Date.now(), name, phone, attendance: {} });
        localStorage.setItem('nativeStudents', JSON.stringify(students));
        renderRegister();
        closeModal();
      }
    });

    function changeMonth(offset) {
      currentDate.setMonth(currentDate.getMonth() + offset);
      renderRegister();
    }

    init();
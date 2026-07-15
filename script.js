    let teacherData = JSON.parse(localStorage.getItem('autoTeacherData')) || null;
    let students = JSON.parse(localStorage.getItem('autoStudents')) || [];
    let currentDate = new Date(); 

    const loginScreen = document.getElementById('login-screen');
    const registerScreen = document.getElementById('register-screen');
    const loginForm = document.getElementById('login-form');
    const studentModal = document.getElementById('student-modal');
    const studentForm = document.getElementById('student-form');
    const statusBar = document.getElementById('sms-status-bar');
    const statusText = document.getElementById('status-text');

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
      localStorage.setItem('autoTeacherData', JSON.stringify(teacherData));
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
          rowHtml += `<td class="${sundayMap[day - 1] ? 'sunday-cell' : ''}"><input type="checkbox" ${isChecked} onchange="toggleAttendance(${student.id}, '${dateKey}', this.checked)"></td>`;
        }
        rowHtml += `</tr>`;
        tableBody.innerHTML += rowHtml;
      });
    }

    // --- Background Automated Send SMS Code ---
    function toggleAttendance(studentId, dateKey, isChecked) {
      students = students.map(student => {
        if (student.id === studentId) {
          if (!student.attendance) student.attendance = {};
          student.attendance[dateKey] = isChecked;
          
          // RUN AUTOMATICALLY IN BACKGROUND WITHOUT CONFIRMATIONS
          sendSmsAutomatically(student, isChecked);
        }
        return student;
      });
      localStorage.setItem('autoStudents', JSON.stringify(students));
    }

    function sendSmsAutomatically(student, isPresent) {
      const message = isPresent 
        ? `Your child ${student.name} is came to school thanks for sending your child`
        : `Your child ${student.name} is not came to school so please send your child properly to school.`;

      // 1. Show live sending status to user
      statusBar.classList.remove('hidden');
      statusText.innerText = `Sending automated text to ${student.name}'s parents...`;

      // 2. Fire web call instantly to SMS gateway
      fetch('https://textbelt.com/text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          'number': student.phone.replace(/[\s\-\(\)]/g, ''), // clean raw numbers
          'message': message,
          'key': 'textbelt' // Standard Free Key (allows 1 text per day for live testing)
        })
      })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          statusText.innerText = `Success! Message sent automatically to ${student.name} (${student.phone}).`;
          setTimeout(() => statusBar.classList.add('hidden'), 5000);
        } else {
          // If you hit the free tier limit
          statusText.innerText = `Background call made, but API returned: "${data.error}"`;
          console.warn(data.error);
        }
      })
      .catch(err => {
        statusText.innerText = `Could not connect to SMS gateway.`;
        console.error(err);
      });
    }

    function openModal() { studentModal.classList.remove('hidden'); }
    function closeModal() { studentModal.classList.add('hidden'); studentForm.reset(); }

    studentForm.addEventListener('submit', function(e) {
      e.preventDefault();
      const name = document.getElementById('student-name-input').value.trim();
      const phone = document.getElementById('student-phone-input').value.trim();
      if (name && phone) {
        students.push({ id: Date.now(), name, phone, attendance: {} });
        localStorage.setItem('autoStudents', JSON.stringify(students));
        renderRegister();
        closeModal();
      }
    });

    function changeMonth(offset) {
      currentDate.setMonth(currentDate.getMonth() + offset);
      renderRegister();
    }

    init();

    // --- State Infrastructure ---
    let teacherData = JSON.parse(localStorage.getItem('responsiveTeacherData')) || null;
    let students = JSON.parse(localStorage.getItem('responsiveStudents')) || [];
    let currentDate = new Date(); 

    // --- DOM Elements ---
    const loginScreen = document.getElementById('login-screen');
    const registerScreen = document.getElementById('register-screen');
    const loginForm = document.getElementById('login-form');

    function init() {
      if (teacherData) {
        showRegisterScreen();
      } else {
        loginScreen.classList.remove('hidden');
        registerScreen.classList.add('hidden');
      }
    }

    loginForm.addEventListener('submit', function(e) {
      e.preventDefault();
      teacherData = {
        name: document.getElementById('teacher-name').value,
        className: document.getElementById('class-name').value,
        phone: document.getElementById('phone-number').value
      };
      localStorage.setItem('responsiveTeacherData', JSON.stringify(teacherData));
      showRegisterScreen();
    });

    function showRegisterScreen() {
      loginScreen.classList.add('hidden');
      registerScreen.classList.remove('hidden');
      document.getElementById('display-class').innerText = teacherData.className;
      document.getElementById('display-teacher').innerText = `Teacher: ${teacherData.name} | Contact: ${teacherData.phone}`;
      renderRegister();
    }

    // --- Core Engine: Grid Rendering & Date Analysis ---
    function renderRegister() {
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth();

      const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
      document.getElementById('month-label').innerText = `${monthNames[month]} ${year}`;

      const totalDays = new Date(year, month + 1, 0).getDate();
      const headerRow = document.getElementById('table-headers');
      
      headerRow.innerHTML = `
        <th>
          Student Name <br>
          <button class="add-btn" onclick="addStudentRow()">+ Add Row</button>
        </th>
      `;
      
      const sundayMap = [];

      for (let day = 1; day <= totalDays; day++) {
        const isSunday = new Date(year, month, day).getDay() === 0;
        sundayMap.push(isSunday);

        const thClass = isSunday ? 'class="sunday-header"' : '';
        headerRow.innerHTML += `<th ${thClass}>${day}</th>`;
      }

      const tableBody = document.getElementById('table-body');
      tableBody.innerHTML = '';

      students.forEach(student => {
        let rowHtml = `<tr><td>${student.name}</td>`;
        
        for (let day = 1; day <= totalDays; day++) {
          const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          const isChecked = student.attendance && student.attendance[dateKey] ? 'checked' : '';
          
          const tdClass = sundayMap[day - 1] ? 'class="sunday-cell"' : '';
          
          rowHtml += `
            <td ${tdClass}>
              <input type="checkbox" ${isChecked} onchange="toggleAttendance(${student.id}, '${dateKey}', this.checked)">
            </td>
          `;
        }
        
        rowHtml += `</tr>`;
        tableBody.innerHTML += rowHtml;
      });
    }

    function addStudentRow() {
      const name = prompt("Enter the new student's name:");
      if (name && name.trim() !== "") {
        const newStudent = {
          id: Date.now(),
          name: name.trim(),
          attendance: {}
        };
        students.push(newStudent);
        localStorage.setItem('responsiveStudents', JSON.stringify(students));
        renderRegister();
      }
    }

    function toggleAttendance(studentId, dateKey, isChecked) {
      students = students.map(student => {
        if (student.id === studentId) {
          if (!student.attendance) student.attendance = {};
          student.attendance[dateKey] = isChecked;
        }
        return student;
      });
      localStorage.setItem('responsiveStudents', JSON.stringify(students));
    }

    function changeMonth(offset) {
      currentDate.setMonth(currentDate.getMonth() + offset);
      renderRegister();
    }

    init();

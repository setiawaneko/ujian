
        // Konfigurasi PDF.js
        pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.11.338/pdf.worker.min.js';

        // Data ujian
        let exams = JSON.parse(localStorage.getItem('exams')) || {
            1: {
                id: 1,
                title: "Ujian Pemrograman Dasar",
                duration: 60,
                teacher: "Bpk. Setiawan Eko Nugroho, S.Kom",
                questions: [
                    {
                        id: 1,
                        text: "Apa yang dimaksud dengan variabel dalam pemrograman?",
                        options: [
                            "Tempat penyimpanan data",
                            "Jenis data",
                            "Fungsi matematika",
                            "Struktur kontrol"
                        ],
                        correct: 0
                    },
                    {
                        id: 2,
                        text: "Manakah yang bukan termasuk tipe data primitif di JavaScript?",
                        options: [
                            "String",
                            "Number",
                            "Boolean",
                            "Array"
                        ],
                        correct: 3
                    }
                ]
            },
            2: {
                id: 2,
                title: "Ujian Struktur Data",
                duration: 45,
                teacher: "Bpk. Setiawan Eko Nugroho, S.Kom",
                questions: [
                    {
                        id: 1,
                        text: "Struktur data yang mengikuti prinsip LIFO adalah?",
                        options: [
                            "Queue",
                            "Stack",
                            "Linked List",
                            "Tree"
                        ],
                        correct: 1
                    }
                ]
            }
        };

        // State aplikasi
        let currentUser = null;
        let currentExam = null;
        let currentQuestionIndex = 0;
        let userAnswers = {};
        let timerInterval = null;
        let timeLeft = 0;
        let currentPdf = null;
        let extractedQuestions = [];

        // Elemen DOM
        const loginPage = document.getElementById('login-page');
        const dashboardPage = document.getElementById('dashboard-page');
        const teacherDashboardPage = document.getElementById('teacher-dashboard-page');
        const uploadPage = document.getElementById('upload-page');
        const examPage = document.getElementById('exam-page');
        const resultPage = document.getElementById('result-page');
        
        const loginBtn = document.getElementById('login-btn');
        const studentName = document.getElementById('student-name');
        const teacherName = document.getElementById('teacher-name');
        const createExamBtn = document.getElementById('create-exam-btn');
        const importQuestionsBtn = document.getElementById('import-questions-btn');
        const prevQuestionBtn = document.getElementById('prev-question');
        const nextQuestionBtn = document.getElementById('next-question');
        const submitExamBtn = document.getElementById('submit-exam');
        const backToDashboardBtn = document.getElementById('back-to-dashboard');
        const uploadArea = document.getElementById('upload-area');
        const pdfFileInput = document.getElementById('pdf-file');
        const pdfPreview = document.getElementById('pdf-preview');
        const pdfPages = document.getElementById('pdf-pages');
        const questionExtraction = document.getElementById('question-extraction');
        const extractedQuestionsContainer = document.getElementById('extracted-questions');
        const saveExamBtn = document.getElementById('save-exam-btn');
        
        const examTitle = document.getElementById('exam-title');
        const questionsContainer = document.getElementById('questions-container');
        const timer = document.getElementById('timer');
        
        const resultExamTitle = document.getElementById('result-exam-title');
        const finalScore = document.getElementById('final-score');
        const resultMessage = document.getElementById('result-message');
        const resultDetails = document.getElementById('result-details');

        // Navigasi
        document.getElementById('nav-home').addEventListener('click', () => {
            showPage(loginPage);
        });
        
        document.getElementById('nav-login').addEventListener('click', () => {
            showPage(loginPage);
        });
        
        document.getElementById('nav-dashboard').addEventListener('click', () => {
            if (currentUser) {
                if (currentUser.type === 'teacher') {
                    showPage(teacherDashboardPage);
                } else {
                    showPage(dashboardPage);
                }
            } else {
                showPage(loginPage);
            }
        });
        
        document.getElementById('nav-upload').addEventListener('click', () => {
            if (currentUser && currentUser.type === 'teacher') {
                showPage(uploadPage);
            } else {
                showPage(loginPage);
            }
        });

        // Fungsi untuk menampilkan halaman tertentu
        function showPage(page) {
            loginPage.classList.add('hidden');
            dashboardPage.classList.add('hidden');
            teacherDashboardPage.classList.add('hidden');
            uploadPage.classList.add('hidden');
            examPage.classList.add('hidden');
            resultPage.classList.add('hidden');
            
            page.classList.remove('hidden');
            
            // Jika menampilkan dashboard, refresh daftar ujian
            if (page === dashboardPage) {
                refreshStudentExamList();
            } else if (page === teacherDashboardPage) {
                refreshTeacherExamList();
            }
        }

        // Login
        loginBtn.addEventListener('click', () => {
            const username = document.getElementById('username').value;
            const password = document.getElementById('password').value;
            const userType = document.getElementById('user-type').value;
            
            if (username && password) {
                // Simulasi login berhasil
                currentUser = {
                    name: username,
                    id: Math.floor(Math.random() * 1000),
                    type: userType
                };
                
                studentName.textContent = currentUser.name;
                teacherName.textContent = currentUser.name;
                
                if (userType === 'teacher') {
                    showPage(teacherDashboardPage);
                } else {
                    showPage(dashboardPage);
                }
                
                // Reset form login
                document.getElementById('username').value = '';
                document.getElementById('password').value = '';
            } else {
                alert('Silakan masukkan username dan password!');
            }
        });

        // Upload PDF
        uploadArea.addEventListener('click', () => {
            pdfFileInput.click();
        });

        uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadArea.classList.add('dragover');
        });

        uploadArea.addEventListener('dragleave', () => {
            uploadArea.classList.remove('dragover');
        });

        uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadArea.classList.remove('dragover');
            
            if (e.dataTransfer.files.length > 0) {
                const file = e.dataTransfer.files[0];
                if (file.type === 'application/pdf') {
                    handlePdfUpload(file);
                } else {
                    alert('Hanya file PDF yang diizinkan!');
                }
            }
        });

        pdfFileInput.addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                const file = e.target.files[0];
                handlePdfUpload(file);
            }
        });

        // Fungsi untuk menangani upload PDF
        async function handlePdfUpload(file) {
            try {
                const arrayBuffer = await file.arrayBuffer();
                currentPdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
                
                // Tampilkan preview PDF
                pdfPreview.classList.remove('hidden');
                pdfPages.innerHTML = '';
                
                // Render setiap halaman
                for (let i = 1; i <= currentPdf.numPages; i++) {
                    const page = await currentPdf.getPage(i);
                    const viewport = page.getViewport({ scale: 1.5 });
                    
                    const canvas = document.createElement('canvas');
                    const context = canvas.getContext('2d');
                    canvas.height = viewport.height;
                    canvas.width = viewport.width;
                    
                    await page.render({
                        canvasContext: context,
                        viewport: viewport
                    }).promise;
                    
                    const pageDiv = document.createElement('div');
                    pageDiv.className = 'page-preview';
                    
                    const pageNumber = document.createElement('div');
                    pageNumber.className = 'page-number';
                    pageNumber.textContent = `Halaman ${i}`;
                    
                    const pageContent = document.createElement('div');
                    pageContent.className = 'page-content';
                    
                    // Ekstrak teks dari halaman
                    const textContent = await page.getTextContent();
                    const textItems = textContent.items.map(item => item.str).join(' ');
                    pageContent.textContent = textItems.substring(0, 300) + '...';
                    
                    pageDiv.appendChild(pageNumber);
                    pageDiv.appendChild(pageContent);
                    pdfPages.appendChild(pageDiv);
                    
                    // Simpan teks untuk ekstraksi soal
                    if (i === 1) {
                        extractQuestionsFromText(textItems);
                    }
                }
                
                // Tampilkan ekstraksi soal
                questionExtraction.classList.remove('hidden');
                displayExtractedQuestions();
                
            } catch (error) {
                console.error('Error loading PDF:', error);
                alert('Terjadi kesalahan saat memuat PDF. Pastikan file PDF valid.');
            }
        }

        // Fungsi untuk mengekstrak soal dari teks PDF
        function extractQuestionsFromText(text) {
            extractedQuestions = [];
            
            // Contoh sederhana: mencari pola nomor soal
            const questionRegex = /\d+\.\s*(.*?)(?=\d+\.|$)/gs;
            let match;
            
            while ((match = questionRegex.exec(text)) !== null) {
                const questionText = match[1].trim();
                
                // Cari opsi jawaban (A, B, C, D)
                const optionRegex = /([A-D])\.\s*(.*?)(?=[A-D]\.|$)/gs;
                const options = [];
                let optionMatch;
                
                while ((optionMatch = optionRegex.exec(questionText)) !== null) {
                    options.push(optionMatch[2].trim());
                }
                
                if (options.length >= 2) {
                    extractedQuestions.push({
                        id: extractedQuestions.length + 1,
                        text: questionText.split(/[A-D]\./)[0].trim(),
                        options: options,
                        correct: 0 // Default: jawaban pertama adalah benar
                    });
                }
            }
            
            // Jika tidak ada soal yang ditemukan dengan regex, buat contoh manual
            if (extractedQuestions.length === 0) {
                extractedQuestions = [
                    {
                        id: 1,
                        text: "Apa yang dimaksud dengan algoritma?",
                        options: [
                            "Langkah-langkah untuk menyelesaikan masalah",
                            "Bahasa pemrograman",
                            "Struktur data",
                            "Jenis variabel"
                        ],
                        correct: 0
                    },
                    {
                        id: 2,
                        text: "Manakah yang termasuk struktur data linear?",
                        options: [
                            "Array",
                            "Tree",
                            "Graph",
                            "Hash Table"
                        ],
                        correct: 0
                    }
                ];
            }
        }

        // Fungsi untuk menampilkan soal yang diekstrak
        function displayExtractedQuestions() {
            extractedQuestionsContainer.innerHTML = '';
            
            extractedQuestions.forEach((question, index) => {
                const questionDiv = document.createElement('div');
                questionDiv.className = 'extracted-question';
                
                const headerDiv = document.createElement('div');
                headerDiv.className = 'extracted-question-header';
                
                const questionNumber = document.createElement('h4');
                questionNumber.textContent = `Soal ${index + 1}`;
                
                const actionsDiv = document.createElement('div');
                actionsDiv.className = 'question-actions';
                
                const editBtn = document.createElement('button');
                editBtn.textContent = 'Edit';
                editBtn.className = 'btn-secondary';
                editBtn.addEventListener('click', () => editQuestion(index));
                
                const deleteBtn = document.createElement('button');
                deleteBtn.textContent = 'Hapus';
                deleteBtn.className = 'btn-danger';
                deleteBtn.addEventListener('click', () => deleteQuestion(index));
                
                actionsDiv.appendChild(editBtn);
                actionsDiv.appendChild(deleteBtn);
                
                headerDiv.appendChild(questionNumber);
                headerDiv.appendChild(actionsDiv);
                
                const questionText = document.createElement('div');
                questionText.innerHTML = `<strong>Pertanyaan:</strong> ${question.text}`;
                
                const optionsList = document.createElement('div');
                optionsList.innerHTML = '<strong>Opsi:</strong>';
                
                const optionsUl = document.createElement('ul');
                question.options.forEach((option, optIndex) => {
                    const li = document.createElement('li');
                    li.textContent = `${String.fromCharCode(65 + optIndex)}. ${option}`;
                    if (optIndex === question.correct) {
                        li.style.fontWeight = 'bold';
                        li.style.color = 'var(--success)';
                    }
                    optionsUl.appendChild(li);
                });
                
                optionsList.appendChild(optionsUl);
                
                questionDiv.appendChild(headerDiv);
                questionDiv.appendChild(questionText);
                questionDiv.appendChild(optionsList);
                
                extractedQuestionsContainer.appendChild(questionDiv);
            });
        }

        // Fungsi untuk mengedit soal
        function editQuestion(index) {
            const question = extractedQuestions[index];
            
            const newText = prompt('Edit pertanyaan:', question.text);
            if (newText !== null) {
                question.text = newText;
            }
            
            let newOptions = '';
            question.options.forEach((option, i) => {
                newOptions += `${String.fromCharCode(65 + i)}. ${option}\n`;
            });
            
            const editedOptions = prompt('Edit opsi (satu opsi per baris):', newOptions);
            if (editedOptions !== null) {
                const optionsArray = editedOptions.split('\n').filter(opt => opt.trim() !== '');
                question.options = optionsArray.map(opt => {
                    // Hapus label A. B. C. D. jika ada
                    return opt.replace(/^[A-D]\.\s*/, '').trim();
                });
            }
            
            const correctAnswer = prompt('Masukkan huruf jawaban benar (A, B, C, atau D):', String.fromCharCode(65 + question.correct));
            if (correctAnswer !== null) {
                const correctIndex = correctAnswer.toUpperCase().charCodeAt(0) - 65;
                if (correctIndex >= 0 && correctIndex < question.options.length) {
                    question.correct = correctIndex;
                }
            }
            
            displayExtractedQuestions();
        }

        // Fungsi untuk menghapus soal
        function deleteQuestion(index) {
            if (confirm('Apakah Anda yakin ingin menghapus soal ini?')) {
                extractedQuestions.splice(index, 1);
                displayExtractedQuestions();
            }
        }

        // Simpan ujian
        saveExamBtn.addEventListener('click', () => {
            const examName = document.getElementById('exam-name').value;
            const examDuration = document.getElementById('exam-duration').value;
            
            if (!examName || !examDuration) {
                alert('Harap isi nama ujian dan durasi!');
                return;
            }
            
            if (extractedQuestions.length === 0) {
                alert('Tidak ada soal yang akan disimpan!');
                return;
            }
            
            // Buat ID unik untuk ujian baru
            const examId = Date.now();
            
            // Simpan ujian
            exams[examId] = {
                id: examId,
                title: examName,
                duration: parseInt(examDuration),
                teacher: currentUser.name,
                questions: [...extractedQuestions]
            };
            
            // Simpan ke localStorage
            localStorage.setItem('exams', JSON.stringify(exams));
            
            alert('Ujian berhasil disimpan!');
            showPage(teacherDashboardPage);
        });

        // Refresh daftar ujian untuk siswa
        function refreshStudentExamList() {
            const examList = document.querySelector('.exam-list');
            examList.innerHTML = '';
            
            Object.values(exams).forEach(exam => {
                const examCard = document.createElement('div');
                examCard.className = 'exam-card';
                
                examCard.innerHTML = `
                    <h3>${exam.title}</h3>
                    <p>Guru: ${exam.teacher}</p>
                    <div class="exam-meta">
                        <span>Waktu: ${exam.duration} menit</span>
                        <span>${exam.questions.length} Soal</span>
                    </div>
                    <button class="btn-start-exam" data-exam="${exam.id}">Mulai Ujian</button>
                `;
                
                examList.appendChild(examCard);
            });
            
            // Tambahkan event listener untuk tombol mulai ujian
            document.querySelectorAll('.btn-start-exam').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const examId = e.target.getAttribute('data-exam');
                    startExam(examId);
                });
            });
        }

        // Refresh daftar ujian untuk guru
        function refreshTeacherExamList() {
            const teacherExamList = document.getElementById('teacher-exam-list');
            teacherExamList.innerHTML = '';
            
            Object.values(exams).forEach(exam => {
                const examCard = document.createElement('div');
                examCard.className = 'exam-card';
                
                examCard.innerHTML = `
                    <h3>${exam.title}</h3>
                    <p>Durasi: ${exam.duration} menit</p>
                    <div class="exam-meta">
                        <span>${exam.questions.length} Soal</span>
                        <span>Dibuat oleh: ${exam.teacher}</span>
                    </div>
                    <div style="margin-top: 15px;">
                        <button class="btn-edit-exam" data-exam="${exam.id}">Edit</button>
                        <button class="btn-delete-exam" data-exam="${exam.id}">Hapus</button>
                    </div>
                `;
                
                teacherExamList.appendChild(examCard);
            });
            
            // Tambahkan event listener untuk tombol edit dan hapus
            document.querySelectorAll('.btn-edit-exam').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const examId = e.target.getAttribute('data-exam');
                    editExam(examId);
                });
            });
            
            document.querySelectorAll('.btn-delete-exam').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const examId = e.target.getAttribute('data-exam');
                    deleteExam(examId);
                });
            });
        }

        // Mulai ujian
        function startExam(examId) {
            currentExam = exams[examId];
            currentQuestionIndex = 0;
            userAnswers = {};
            
            // Set timer
            timeLeft = currentExam.duration * 60; // konversi ke detik
            updateTimerDisplay();
            timer.classList.remove('hidden');
            
            // Mulai timer
            if (timerInterval) clearInterval(timerInterval);
            timerInterval = setInterval(() => {
                timeLeft--;
                updateTimerDisplay();
                
                if (timeLeft <= 0) {
                    clearInterval(timerInterval);
                    finishExam();
                }
            }, 1000);
            
            // Tampilkan halaman ujian
            examTitle.textContent = currentExam.title;
            showPage(examPage);
            
            // Tampilkan pertanyaan pertama
            displayQuestion();
        }

        // Update tampilan timer
        function updateTimerDisplay() {
            const minutes = Math.floor(timeLeft / 60);
            const seconds = timeLeft % 60;
            timer.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
            
            // Ubah warna jika waktu hampir habis
            if (timeLeft < 300) { // 5 menit
                timer.style.backgroundColor = 'var(--danger)';
            }
        }

        // Tampilkan pertanyaan
        function displayQuestion() {
            const question = currentExam.questions[currentQuestionIndex];
            
            let html = `
                <div class="question">
                    <div class="question-number">Pertanyaan ${currentQuestionIndex + 1} dari ${currentExam.questions.length}</div>
                    <div class="question-text">${question.text}</div>
                    <div class="options">
            `;
            
            question.options.forEach((option, index) => {
                const isChecked = userAnswers[question.id] === index ? 'checked' : '';
                html += `
                    <div class="option">
                        <input type="radio" id="q${question.id}_opt${index}" name="q${question.id}" value="${index}" ${isChecked}>
                        <label for="q${question.id}_opt${index}">${String.fromCharCode(65 + index)}. ${option}</label>
                    </div>
                `;
            });
            
            html += `</div></div>`;
            
            questionsContainer.innerHTML = html;
            
            // Tambahkan event listener untuk opsi
            question.options.forEach((option, index) => {
                document.getElementById(`q${question.id}_opt${index}`).addEventListener('change', (e) => {
                    userAnswers[question.id] = parseInt(e.target.value);
                });
            });
            
            // Tampilkan/tutup tombol navigasi
            prevQuestionBtn.style.display = currentQuestionIndex > 0 ? 'inline-block' : 'none';
            nextQuestionBtn.style.display = currentQuestionIndex < currentExam.questions.length - 1 ? 'inline-block' : 'none';
            submitExamBtn.classList.toggle('hidden', currentQuestionIndex < currentExam.questions.length - 1);
        }

        // Navigasi pertanyaan
        prevQuestionBtn.addEventListener('click', () => {
            if (currentQuestionIndex > 0) {
                currentQuestionIndex--;
                displayQuestion();
            }
        });

        nextQuestionBtn.addEventListener('click', () => {
            if (currentQuestionIndex < currentExam.questions.length - 1) {
                currentQuestionIndex++;
                displayQuestion();
            }
        });

        // Selesai ujian
        submitExamBtn.addEventListener('click', () => {
            if (confirm('Apakah Anda yakin ingin menyelesaikan ujian?')) {
                finishExam();
            }
        });

        // Fungsi untuk menyelesaikan ujian
        function finishExam() {
            clearInterval(timerInterval);
            
            // Hitung skor
            let score = 0;
            let correctAnswers = 0;
            
            currentExam.questions.forEach(question => {
                if (userAnswers[question.id] === question.correct) {
                    correctAnswers++;
                }
            });
            
            score = Math.round((correctAnswers / currentExam.questions.length) * 100);
            
            // Tampilkan hasil
            resultExamTitle.textContent = currentExam.title;
            finalScore.textContent = score;
            
            // Tentukan pesan hasil
            if (score >= 80) {
                resultMessage.textContent = "Selamat! Anda lulus dengan nilai yang sangat baik.";
                resultMessage.style.color = "var(--success)";
            } else if (score >= 60) {
                resultMessage.textContent = "Anda lulus ujian. Pertahankan!";
                resultMessage.style.color = "var(--warning)";
            } else {
                resultMessage.textContent = "Maaf, Anda belum lulus. Silakan coba lagi.";
                resultMessage.style.color = "var(--danger)";
            }
            
            // Tampilkan detail hasil
            let detailsHtml = "<h3>Detail Jawaban:</h3>";
            currentExam.questions.forEach((question, index) => {
                const userAnswer = userAnswers[question.id];
                const isCorrect = userAnswer === question.correct;
                
                detailsHtml += `
                    <div class="question" style="margin-bottom: 15px; padding: 10px; border-radius: 4px; background-color: ${isCorrect ? 'rgba(46, 204, 113, 0.1)' : 'rgba(231, 76, 60, 0.1)'}">
                        <div class="question-number">Pertanyaan ${index + 1}</div>
                        <div class="question-text">${question.text}</div>
                        <div style="margin-top: 10px;">
                            <p><strong>Jawaban Anda:</strong> ${userAnswer !== undefined ? `${String.fromCharCode(65 + userAnswer)}. ${question.options[userAnswer]}` : 'Tidak dijawab'}</p>
                            <p><strong>Jawaban Benar:</strong> ${String.fromCharCode(65 + question.correct)}. ${question.options[question.correct]}</p>
                            <p style="color: ${isCorrect ? 'var(--success)' : 'var(--danger)'}; font-weight: bold;">
                                ${isCorrect ? '✓ Benar' : '✗ Salah'}
                            </p>
                        </div>
                    </div>
                `;
            });
            
            resultDetails.innerHTML = detailsHtml;
            
            // Tampilkan halaman hasil
            showPage(resultPage);
        }

        // Kembali ke dashboard
        backToDashboardBtn.addEventListener('click', () => {
            if (currentUser.type === 'teacher') {
                showPage(teacherDashboardPage);
            } else {
                showPage(dashboardPage);
            }
        });

        // Buat ujian baru
        createExamBtn.addEventListener('click', () => {
            // Reset form upload
            document.getElementById('exam-name').value = '';
            document.getElementById('exam-duration').value = '';
            pdfPreview.classList.add('hidden');
            questionExtraction.classList.add('hidden');
            extractedQuestions = [];
            
            showPage(uploadPage);
        });

        // Import soal dari PDF
        importQuestionsBtn.addEventListener('click', () => {
            showPage(uploadPage);
        });

        // Edit ujian
        function editExam(examId) {
            const exam = exams[examId];
            extractedQuestions = [...exam.questions];
            
            // Isi form
            document.getElementById('exam-name').value = exam.title;
            document.getElementById('exam-duration').value = exam.duration;
            
            // Tampilkan ekstraksi soal
            pdfPreview.classList.add('hidden');
            questionExtraction.classList.remove('hidden');
            displayExtractedQuestions();
            
            showPage(uploadPage);
        }

        // Hapus ujian
        function deleteExam(examId) {
            if (confirm('Apakah Anda yakin ingin menghapus ujian ini?')) {
                delete exams[examId];
                localStorage.setItem('exams', JSON.stringify(exams));
                refreshTeacherExamList();
            }
        }

        // Inisialisasi: tampilkan halaman login
        showPage(loginPage);
    
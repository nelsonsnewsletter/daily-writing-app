document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const promptDisplay = document.getElementById('prompt-display');
    const generateBtn = document.getElementById('generate-btn');
    const minutesDisplay = document.getElementById('minutes');
    const secondsDisplay = document.getElementById('seconds');
    const timerSlider = document.getElementById('timer-slider');
    const timerValue = document.getElementById('timer-value');
    const startTimerBtn = document.getElementById('start-timer');
    const pauseTimerBtn = document.getElementById('pause-timer');
    const resetTimerBtn = document.getElementById('reset-timer');
    const voiceBtn = document.getElementById('voice-btn');
    const saveBtn = document.getElementById('save-btn');
    const writingArea = document.getElementById('writing-area');
    const entriesList = document.getElementById('entries-list');

    // App State
    let timerInterval;
    let timeLeft = 15 * 60; // 15 minutes in seconds
    let isTimerRunning = false;
    let recognition;
    let currentEntry = {
        date: new Date().toISOString().split('T')[0],
        prompt: '',
        content: '',
    };

    // Initialize the app
    init();

    function init() {
        loadEntries();
        setupEventListeners();
        checkVoiceSupport();
        
        // Auto-load today's entry if it exists
        const todayEntry = getSavedEntries().find(entry => entry.date === currentEntry.date);
        if (todayEntry) {
            currentEntry = todayEntry;
            promptDisplay.textContent = currentEntry.prompt || \"Click 'Generate Prompt' to get started\";
            writingArea.value = currentEntry.content || '';
        }
    }

    function setupEventListeners() {
        generateBtn.addEventListener('click', generatePrompt);
        
        timerSlider.addEventListener('input', updateTimerValue);
        startTimerBtn.addEventListener('click', startTimer);
        pauseTimerBtn.addEventListener('click', pauseTimer);
        resetTimerBtn.addEventListener('click', resetTimer);
        
        voiceBtn.addEventListener('click', toggleVoiceRecognition);
        saveBtn.addEventListener('click', saveEntry);
        
        // Auto-save every 30 seconds
        setInterval(autoSave, 30000);
        
        // Save when user leaves the page
        window.addEventListener('beforeunload', autoSave);
    }

    async function generatePrompt() {
        promptDisplay.textContent = \"Generating prompt...\";
        
        try {
            // Using a free API for text generation
            const response = await fetch('https://api.quotable.io/random');
            const data = await response.json();
            
            // Use the quote as inspiration for a writing prompt
            const prompt = \Write about this idea: \"\\" - \\;
            
            promptDisplay.textContent = prompt;
            currentEntry.prompt = prompt;
        } catch (error) {
            // Fallback to local prompts if API fails
            const prompts = [
                \"Write about a childhood memory that still affects you today.\",
                \"Describe a place you've never been to but would love to visit.\",
                \"Write a letter to your future self 10 years from now.\",
                \"What would you do if you had only one month to live?\",
                \"Describe a person who changed your life.\",
                \"Write about a skill you wish you had.\",
                \"What does success mean to you?\",
                \"Write about a time you faced a difficult decision.\",
                \"Describe your perfect day from start to finish.\",
                \"What are three things you're grateful for today and why?\"
            ];
            
            const randomPrompt = prompts[Math.floor(Math.random() * prompts.length)];
            promptDisplay.textContent = randomPrompt;
            currentEntry.prompt = randomPrompt;
            
            console.error(\"Error fetching from API, used fallback prompt\", error);
        }
    }

    function updateTimerValue() {
        const minutes = timerSlider.value;
        timerValue.textContent = \\ minutes\;
        timeLeft = minutes * 60;
        updateTimerDisplay();
    }

    function startTimer() {
        if (isTimerRunning) return;
        
        isTimerRunning = true;
        timerInterval = setInterval(() => {
            timeLeft--;
            
            if (timeLeft <= 0) {
                clearInterval(timerInterval);
                isTimerRunning = false;
                timeLeft = 0;
                alert(\"Time's up! Your writing session is complete.\");
            }
            
            updateTimerDisplay();
        }, 1000);
    }

    function pauseTimer() {
        clearInterval(timerInterval);
        isTimerRunning = false;
    }

    function resetTimer() {
        pauseTimer();
        timeLeft = timerSlider.value * 60;
        updateTimerDisplay();
    }

    function updateTimerDisplay() {
        const minutes = Math.floor(timeLeft / 60);
        const seconds = timeLeft % 60;
        
        minutesDisplay.textContent = minutes.toString().padStart(2, '0');
        secondsDisplay.textContent = seconds.toString().padStart(2, '0');
    }

    function checkVoiceSupport() {
        if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
            voiceBtn.disabled = true;
            voiceBtn.textContent = 'Voice Dictation Not Supported';
        }
    }

    function toggleVoiceRecognition() {
        if (recognition && recognition.running) {
            recognition.stop();
            voiceBtn.textContent = 'Start Voice Dictation';
            return;
        }
        
        // Initialize speech recognition
        recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
        recognition.continuous = true;
        recognition.interimResults = true;
        
        recognition.onstart = () => {
            voiceBtn.textContent = 'Stop Voice Dictation';
        };
        
        recognition.onresult = (event) => {
            const transcript = Array.from(event.results)
                .map(result => result[0].transcript)
                .join('');
                
            // Append to current text or replace selection
            const selStart = writingArea.selectionStart;
            const selEnd = writingArea.selectionEnd;
            
            writingArea.value = 
                writingArea.value.substring(0, selStart) +
                transcript +
                writingArea.value.substring(selEnd);
                
            // Update cursor position
            writingArea.selectionStart = selStart + transcript.length;
            writingArea.selectionEnd = selStart + transcript.length;
            
            // Update current entry
            currentEntry.content = writingArea.value;
        };
        
        recognition.onend = () => {
            voiceBtn.textContent = 'Start Voice Dictation';
        };
        
        recognition.onerror = (event) => {
            console.error('Speech recognition error', event.error);
            voiceBtn.textContent = 'Start Voice Dictation';
        };
        
        recognition.start();
    }

    function autoSave() {
        if (writingArea.value.trim() !== '') {
            currentEntry.content = writingArea.value;
            saveEntryToLocalStorage();
        }
    }

    function saveEntry() {
        currentEntry.content = writingArea.value;
        currentEntry.lastSaved = new Date().toISOString();
        
        saveEntryToLocalStorage();
        alert('Entry saved successfully!');
    }

    function saveEntryToLocalStorage() {
        const entries = getSavedEntries();
        
        // Find if entry for today already exists
        const existingEntryIndex = entries.findIndex(entry => entry.date === currentEntry.date);
        
        if (existingEntryIndex !== -1) {
            entries[existingEntryIndex] = currentEntry;
        } else {
            entries.push(currentEntry);
        }
        
        localStorage.setItem('writingEntries', JSON.stringify(entries));
        loadEntries(); // Refresh the entries list
    }

    function getSavedEntries() {
        const entriesJson = localStorage.getItem('writingEntries');
        return entriesJson ? JSON.parse(entriesJson) : [];
    }

    function loadEntries() {
        const entries = getSavedEntries();
        entriesList.innerHTML = '';
        
        if (entries.length === 0) {
            entriesList.innerHTML = '<p>No saved entries yet.</p>';
            return;
        }
        
        // Sort entries by date (newest first)
        entries.sort((a, b) => new Date(b.date) - new Date(a.date));
        
        entries.forEach(entry => {
            const entryItem = document.createElement('div');
            entryItem.className = 'entry-item';
            
            const promptPreview = entry.prompt 
                ? entry.prompt.substring(0, 30) + (entry.prompt.length > 30 ? '...' : '')
                : 'No prompt';
                
            entryItem.innerHTML = \
                <strong>\</strong>: \
            \;
            
            entryItem.addEventListener('click', () => loadEntry(entry));
            entriesList.appendChild(entryItem);
        });
    }

    function loadEntry(entry) {
        // Ask for confirmation if current entry has unsaved changes
        if (currentEntry.content !== writingArea.value && 
            writingArea.value.trim() !== '' && 
            !confirm('You have unsaved changes. Load another entry anyway?')) {
            return;
        }
        
        currentEntry = entry;
        promptDisplay.textContent = entry.prompt || \"No prompt for this entry\";
        writingArea.value = entry.content || '';
    }
});

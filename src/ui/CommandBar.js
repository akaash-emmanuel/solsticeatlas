
export class CommandBar {
    constructor(onSubmit) {
        this.onSubmit = onSubmit;
        this.element = this.createUI();
        this.input = this.element.querySelector('input');
        this.history = [];
    }

    createUI() {
        const container = document.createElement('div');
        Object.assign(container.style, {
            position: 'absolute',
            bottom: '120px', // Lifted slightly
            left: '50%',
            transform: 'translateX(-50%)',
            width: '450px',
            zIndex: '2000',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            fontFamily: 'Arial, sans-serif'
        });

        // Suggestions Container
        const suggestions = document.createElement('div');
        Object.assign(suggestions.style, {
            display: 'flex', gap: '8px', marginBottom: '12px', flexWrap: 'wrap', justifyContent: 'center'
        });

        ['Fly to Mars', 'Show Earthquakes', 'Solar System', 'Reset'].forEach(text => {
            const chip = document.createElement('button');
            chip.innerText = text;
            Object.assign(chip.style, {
                background: 'rgba(20, 30, 40, 0.6)',
                border: '1px solid rgba(255,255,255,0.2)',
                color: '#aaa',
                borderRadius: '16px',
                padding: '4px 12px',
                fontSize: '12px',
                cursor: 'pointer',
                backdropFilter: 'blur(4px)',
                transition: 'all 0.2s'
            });
            chip.addEventListener('mouseenter', () => { chip.style.background = 'rgba(0, 255, 255, 0.2)'; chip.style.color = 'white'; });
            chip.addEventListener('mouseleave', () => { chip.style.background = 'rgba(20, 30, 40, 0.6)'; chip.style.color = '#aaa'; });
            chip.addEventListener('click', () => {
                this.input.value = text;
                this.submit(text);
            });
            suggestions.appendChild(chip);
        });
        container.appendChild(suggestions);

        // Input Bar
        const inputWrapper = document.createElement('div');
        Object.assign(inputWrapper.style, {
            width: '100%',
            background: 'rgba(0, 0, 0, 0.6)',
            backdropFilter: 'blur(10px)',
            borderRadius: '24px',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            padding: '4px',
            display: 'flex',
            alignItems: 'center',
            boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
            transition: 'all 0.3s'
        });

        const icon = document.createElement('span');
        icon.innerText = '✨';
        icon.style.padding = '0 12px';
        icon.style.fontSize = '18px';

        const input = document.createElement('input');
        Object.assign(input.style, {
            flex: '1',
            background: 'transparent',
            border: 'none',
            color: 'white',
            fontSize: '16px',
            padding: '12px 0',
            outline: 'none',
            fontFamily: 'inherit'
        });
        input.placeholder = "Ask Atlas... (e.g. 'Take me to Jupiter')";

        inputWrapper.appendChild(icon);
        inputWrapper.appendChild(input);
        container.appendChild(inputWrapper);

        // Status Text
        const status = document.createElement('div');
        status.id = 'atlas-status';
        Object.assign(status.style, {
            marginTop: '8px',
            fontSize: '12px',
            color: 'cyan',
            opacity: '0',
            transition: 'opacity 0.3s',
            textShadow: '0 0 5px rgba(0,0,0,0.8)'
        });
        status.innerText = "Processing...";
        container.appendChild(status);

        // Logic
        this.submit = async (query) => {
            if (!query.trim()) return;
            this.input.disabled = true;
            this.setStatus(true, "Thinking...", "cyan");

            try {
                const success = await this.onSubmit(query);
                if (success) {
                    this.setStatus(false); // Hide on success
                    this.input.value = '';
                } else {
                    this.setStatus(true, "I didn't capture that. Try 'Fly to Mars'.", "#ff4444");
                    // Shake effect?
                    inputWrapper.style.transform = 'translateX(10px)';
                    setTimeout(() => inputWrapper.style.transform = 'translateX(-10px)', 50);
                    setTimeout(() => inputWrapper.style.transform = 'translateX(0)', 100);
                }
            } catch (e) {
                this.setStatus(true, "Connection Error.", "red");
            }

            this.input.disabled = false;
            this.input.focus();
        };

        // Listeners
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') this.submit(input.value);
        });

        input.addEventListener('focus', () => {
            inputWrapper.style.background = 'rgba(0, 0, 0, 0.8)';
            inputWrapper.style.border = '1px solid rgba(0, 255, 255, 0.5)';
        });
        input.addEventListener('blur', () => {
            inputWrapper.style.background = 'rgba(0, 0, 0, 0.6)';
            inputWrapper.style.border = '1px solid rgba(255, 255, 255, 0.2)';
        });

        document.body.appendChild(container);
        return container;
    }

    setStatus(visible, text, color) {
        const el = this.element.querySelector('#atlas-status');
        if (text) el.innerText = text;
        if (color) el.style.color = color;
        el.style.opacity = visible ? '1' : '0';
    }
}

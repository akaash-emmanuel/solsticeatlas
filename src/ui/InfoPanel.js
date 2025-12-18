
export class InfoPanel {
    constructor() {
        this.container = document.createElement('div');
        Object.assign(this.container.style, {
            position: 'absolute',
            top: '20px',
            left: '20px',
            maxWidth: '320px',
            maxHeight: '80vh',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
            zIndex: '999',
            fontFamily: 'Arial, sans-serif',
            pointerEvents: 'none'
        });
        this.container.style.pointerEvents = 'auto';

        document.body.appendChild(this.container);
        this.sections = {};
    }

    addSection(id, title, contentArg) {
        if (this.sections[id]) return;

        const section = document.createElement('div');
        Object.assign(section.style, {
            backgroundColor: 'rgba(10, 20, 30, 0.85)',
            borderRadius: '12px',
            border: '1px solid rgba(0, 255, 255, 0.3)',
            padding: '15px',
            color: 'white',
            backdropFilter: 'blur(5px)',
            boxShadow: '0 4px 15px rgba(0,0,0,0.5)',
            transform: 'translateX(-20px)',
            opacity: '0',
            transition: 'all 0.3s ease'
        });

        const header = document.createElement('h3');
        header.innerText = title;
        Object.assign(header.style, {
            margin: '0 0 10px 0',
            fontSize: '14px',
            color: '#00ffff',
            textTransform: 'uppercase',
            letterSpacing: '1px',
            borderBottom: '1px solid rgba(255,255,255,0.1)',
            paddingBottom: '5px'
        });
        section.appendChild(header);

        const content = document.createElement('div');

        // SUPPORT DOM ELEMENTS (Fix for [object HTMLDivElement])
        if (contentArg instanceof Node) {
            content.appendChild(contentArg);
        } else {
            content.innerHTML = contentArg;
        }

        Object.assign(content.style, {
            fontSize: '12px',
            lineHeight: '1.4',
            color: '#cccccc'
        });
        section.appendChild(content);

        this.container.appendChild(section);
        this.sections[id] = { element: section, contentElement: content };

        // Animate in
        requestAnimationFrame(() => {
            section.style.transform = 'translateX(0)';
            section.style.opacity = '1';
        });

        return content;
    }

    updateSection(id, contentArg) {
        const section = this.sections[id];
        if (section) {
            // SUPPORT DOM ELEMENTS
            if (contentArg instanceof Node) {
                section.contentElement.innerHTML = ''; // Clear prev
                section.contentElement.appendChild(contentArg);
            } else {
                section.contentElement.innerHTML = contentArg;
            }
        }
    }

    removeSection(id) {
        const section = this.sections[id];
        if (section) {
            // Animate out
            section.element.style.transform = 'translateX(-20px)';
            section.element.style.opacity = '0';

            setTimeout(() => {
                if (section.element.parentNode) {
                    section.element.remove();
                }
                delete this.sections[id];
            }, 300);
        }
    }

    clearAll() {
        Object.keys(this.sections).forEach(id => this.removeSection(id));
    }
}

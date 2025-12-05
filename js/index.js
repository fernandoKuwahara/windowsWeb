class InteractJSDRM {
    #zIndexFocus = 10;
    #ctrlNewPages = 1;
    #patternPositionY = 0;
    #limitNewWindows = 4;
    #canAddNewWindow = true;
    #hasPages = new Map();
    #hasPageInButton = new Map();
    #maximizeButtons = new Map();
    #isMobile = false;

    constructor() {
        this.#detectDevice();
        window.addEventListener('resize', () => this.#handleResize());
    }

    // Detecta se é dispositivo móvel
    #detectDevice() {
        this.#isMobile = window.innerWidth <= 768 || 
                        /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    }

    // Lida com mudanças de orientação/tamanho
    #handleResize() {
        const wasMobile = this.#isMobile;
        this.#detectDevice();
        
        // Se mudou de desktop para mobile ou vice-versa, reposiciona janelas
        if (wasMobile !== this.#isMobile) {
            this.#hasPages.forEach((window) => {
                this.#repositionWindowForDevice(window);
            });
        }
    }

    // Reposiciona janela baseado no dispositivo
    #repositionWindowForDevice(window) {
        if (this.#isMobile) {
            // Mobile: janela ocupa tela inteira
            window.style.width = '100%';
            window.style.height = '100%';
            window.style.top = '0px';
            window.style.left = '0px';
            window.style.transform = 'translate(0px, 0px)';
            window.setAttribute('data-x', 0);
            window.setAttribute('data-y', 0);
            window.classList.add('mobile-fullscreen');
        } else {
            // Desktop: remove classe mobile e mantém posicionamento
            window.classList.remove('mobile-fullscreen');
        }
    }

    // Abre uma nova janela ou minimiza se já estiver aberta (desktop) / foca (mobile)
    openNewWindow(data) {
        const container = document.querySelector(".windowsContainer");

        const idButton = data.buttonParent.id;
        
        // Se já existe janela para este botão
        if (this.#hasPageInButton.has(idButton)) {
            const windowElement = this.#hasPageInButton.get(idButton);
            
            // Se a janela está no DOM (visível)
            if (this.#hasPages.has(windowElement.id)) {
                // Mobile: apenas foca a janela
                if (this.#isMobile) {
                    this.handleFocus(windowElement, idButton);
                    return;
                }
                
                // Desktop: minimiza (toggle)
                this.minimizeWindow(windowElement);
                return;
            }
            
            // Se não está no DOM, traz ela de volta
            this.#hasPages.set(windowElement.id, windowElement);
            container.appendChild(windowElement);
            
            this.handleFocus(windowElement, idButton);
            return;
        }

        if (!this.#canAddNewWindow) {
            this.canAddWindow();
            return;
        }

        const newWindow = this.#createWindowElement(data);
        
        // Remove foco de outras janelas
        this.#unfocusAllWindows();
        
        const windowId = `window-index-${this.#ctrlNewPages}`;
        
        // Adiciona ao mapa de janelas
        this.#hasPages.set(windowId, newWindow);

        // Configura posição e tamanho iniciais
        this.#setInitialWindowPosition(newWindow);

        // Adiciona ao mapa de Botões abertos
        this.#hasPageInButton.set(idButton, newWindow);
        
        // Configura eventos
        this.#setupWindowEvents(newWindow, idButton);
        
        // Adiciona ao DOM
        container.appendChild(newWindow);
        
        this.#ctrlNewPages++;
        this.canAddWindow();
    }

    // Cria e monta o HTML da janela
    #createWindowElement(data) {
        const newWindow = document.createElement("section");
        newWindow.setAttribute("class", "windowContainer");
        const windowId = `window-index-${this.#ctrlNewPages}`;
        newWindow.setAttribute("id", windowId);
        
        // Inicializa atributos de posição
        newWindow.setAttribute('data-x', 0);
        newWindow.setAttribute('data-y', 0);

        // Cria header
        const header = this.#createHeader(data.title, newWindow, windowId);
        
        // Cria conteúdo
        const content = document.createElement("section");
        content.setAttribute("class", "contentContainerWindow");
        content.innerHTML = data.text;

        newWindow.appendChild(header);
        newWindow.appendChild(content);

        return newWindow;
    }

    // Criar o cabeçalho da página, com o título da janela
    #createHeader(title, windowElement, windowId) {
        const header = document.createElement("header");
        header.setAttribute("class", "windowHeader");

        // Título
        const titleSection = document.createElement("section");
        titleSection.setAttribute("class", "titleHeader");
        const titleElement = document.createElement("h1");
        titleElement.innerText = title;
        titleSection.append(titleElement);

        // Botões de ação
        const iconsContainer = document.createElement("section");
        iconsContainer.setAttribute("class", "iconsActionHeader");

        // Botão minimizar (fechar no mobile)
        const btnMinimize = this.#createButton(
            "fa-solid fa-xmark", 
            () => this.minimizeWindow(windowElement)
        );
        
        // Botão maximizar (não mostrado no mobile por padrão)
        const btnMaximize = this.#createButton(
            "fa-regular fa-square", 
            () => this.toggleMaximize(windowElement)
        );
        
        // Guarda referência do botão maximizar
        this.#maximizeButtons.set(windowId, btnMaximize);
        
        // No mobile, esconde o botão de maximizar
        if (this.#isMobile) {
            btnMaximize.style.display = 'none';
        }

        iconsContainer.appendChild(btnMaximize);
        iconsContainer.appendChild(btnMinimize);

        header.appendChild(titleSection);
        header.appendChild(iconsContainer);

        return header;
    }

    // Cria os botões das janelas para interação
    #createButton(iconClass, clickHandler) {
        const button = document.createElement("button");
        button.addEventListener("click", clickHandler);
        
        const icon = document.createElement("i");
        icon.setAttribute("class", iconClass);
        
        button.append(icon);
        return button;
    }

    // Define a posição inicial da janela
    #setInitialWindowPosition(window) {
        const top = this.#patternPositionY;
        const container = document.querySelector(".windowsContainer");
        const xPosition = container.getBoundingClientRect().width * 0.5;
        const yPosition = container.getBoundingClientRect().height * 0.5;

        if (this.#isMobile) {
            // Mobile: janela ocupa tela inteira
            window.style.top = '0px';
            window.style.left = '0px';
            window.style.width = '100%';
            window.style.height = '100%';
            window.style.transform = 'translate(0px, 0px)';
            window.classList.add('mobile-fullscreen');

            if (this.#hasPages.size === 1) {
                window.style.top = `0px`;
                window.style.left = '0px';
                window.style.width = '100%';
                window.style.height = '100%';
            } else if (this.#hasPages.size === 2) {
                window.style.top = `${yPosition}px`;
                window.style.left = '0px';
                window.style.width = '100%';
                window.style.height = '100%';
            } else {
                window.style.top = `${yPosition * 0.5}px`;
                window.style.left = '0px';
                window.style.width = '100%';
                window.style.height = '100%';
            }

            return;
        }

        // Desktop: posicionamento baseado na quantidade de janelas
        if (this.#hasPages.size === 1) {
            window.style.top = `${top}px`;
            window.style.left = `0px`;
            window.style.width = "50vw";
            window.style.height = "45vh";
        } else if (this.#hasPages.size === 2) {
            window.style.top = `${yPosition}px`;
            window.style.left = `0px`;
            window.style.width = "50vw";
            window.style.height = "45vh";
        } else if (this.#hasPages.size === 3) {
            window.style.top = `${top}px`;
            window.style.left = `${xPosition}px`;
            window.style.width = "50vw";
            window.style.height = "45vh";
        } else {
            window.style.top = `${yPosition}px`;
            window.style.left = `${xPosition}px`;
            window.style.width = "50vw";
            window.style.height = "45vh";
        }
        
        window.style.transform = `translate(0px, 0px)`;
    }

    // Remove o foco das janelas
    #unfocusAllWindows() {
        this.#hasPages.forEach((win) => {
            win.classList.add("unfocused");
        });
    }

    // Configura e define os eventos das janelas
    #setupWindowEvents(window, buttonParentId) {
        // Evento de foco
        window.addEventListener("click", () => this.handleFocus(window, buttonParentId));
        this.handleFocus(window, buttonParentId);

        // No mobile, não configura Interact.js (ou configura apenas drag vertical)
        if (this.#isMobile) {
            // Mobile: permite apenas swipe down para minimizar
            this.#setupMobileGestures(window);
        } else {
            // Desktop: configura Interact.js completo
            this.#setupDesktopInteractions(window);
        }
    }

    // Gestos para mobile
    #setupMobileGestures(window) {
        let startY = 0;
        let currentY = 0;
        let isDragging = false;

        const header = window.querySelector('.windowHeader');

        header.addEventListener('touchstart', (e) => {
            startY = e.touches[0].clientY;
            isDragging = true;
        }, { passive: true });

        header.addEventListener('touchmove', (e) => {
            if (!isDragging) return;
            
            currentY = e.touches[0].clientY;
            const deltaY = currentY - startY;

            // Permite apenas arrastar para baixo
            if (deltaY > 0) {
                window.style.transform = `translateY(${deltaY}px)`;
            }
        }, { passive: true });

        header.addEventListener('touchend', (e) => {
            if (!isDragging) return;
            isDragging = false;

            const deltaY = currentY - startY;

            // Se arrastou mais de 100px para baixo, minimiza
            if (deltaY > 100) {
                this.minimizeWindow(window);
            } else {
                // Volta para posição original
                window.style.transform = 'translateY(0px)';
            }
        }, { passive: true });
    }

    // Interações para desktop
    #setupDesktopInteractions(window) {
        interact(window)
            .resizable({
                edges: { left: true, right: true, bottom: true, top: false },
                listeners: {
                    start: (event) => this.#onResizeStart(event),
                    move: (event) => this.handleResizable(event)
                },
                modifiers: [
                    interact.modifiers.restrictEdges({
                        outer: 'parent'
                    })
                ],
                inertia: true
            })
            .draggable({
                allowFrom: '.windowHeader',
                inertia: true,
                modifiers: [
                    interact.modifiers.restrictRect({
                        restriction: 'parent',
                        endOnly: true
                    })
                ],
                listeners: {
                    start: (event) => this.#onDragStart(event),
                    move: (event) => this.handleMove(event)
                }
            });
    }

    // Detecta quando começa a arrastar (desktop)
    #onDragStart(event) {
        const target = event.target;
        
        if (target.classList.contains("maximized")) {
            const rect = target.getBoundingClientRect();
            const mouseXPercent = (event.clientX - rect.left) / rect.width;
            
            this.#restoreWindowState(target);
            
            const newRect = target.getBoundingClientRect();
            const newWidth = parseFloat(target.style.width);
            const offsetX = mouseXPercent * newWidth;
            
            const newX = event.clientX - offsetX - rect.left;
            const newY = event.clientY - newRect.top;
            
            target.style.transform = `translate(${newX}px, ${newY}px)`;
            target.setAttribute('data-x', newX);
            target.setAttribute('data-y', newY);
        }
        
        this.handleFocus(target);
    }

    // Detecta quando começa a redimensionar (desktop)
    #onResizeStart(event) {
        const target = event.target;
        
        if (target.classList.contains("maximized")) {
            this.#restoreWindowState(target);
            
            const style = getComputedStyle(target);
            target.dataset.prevWidth = style.width;
            target.dataset.prevHeight = style.height;
            target.dataset.prevX = target.getAttribute('data-x') || '0';
            target.dataset.prevY = target.getAttribute('data-y') || '0';
        }
    }

    // Restaura o estado visual da janela
    #restoreWindowState(targetWindow) {
        const windowId = targetWindow.getAttribute("id");
        const buttonIcon = this.#maximizeButtons.get(windowId);
        
        targetWindow.style.width = targetWindow.dataset.prevWidth;
        targetWindow.style.height = targetWindow.dataset.prevHeight;
        
        const prevX = parseFloat(targetWindow.dataset.prevX) || 0;
        const prevY = parseFloat(targetWindow.dataset.prevY) || 0;
        
        targetWindow.style.transform = `translate(${prevX}px, ${prevY}px)`;
        targetWindow.setAttribute('data-x', prevX);
        targetWindow.setAttribute('data-y', prevY);
        
        targetWindow.classList.remove("maximized");
        
        if (buttonIcon) {
            buttonIcon.innerHTML = '<i class="fa-regular fa-square"></i>';
        }
    }

    // Controla o evento de maximização da página (desktop)
    toggleMaximize(targetWindow) {
        // Não funciona no mobile
        if (this.#isMobile) return;

        if (!targetWindow.classList.contains("maximized")) {
            this.#maximizeWindow(targetWindow);
        } else {
            this.#restoreWindow(targetWindow);
        }
    }

    // Função que maximiza a janela (desktop)
    #maximizeWindow(targetWindow) {
        const windowId = targetWindow.getAttribute("id");
        const buttonIcon = this.#maximizeButtons.get(windowId);
        const style = getComputedStyle(targetWindow);
        
        targetWindow.dataset.prevWidth = style.width;
        targetWindow.dataset.prevHeight = style.height;
        targetWindow.dataset.prevX = targetWindow.getAttribute('data-x') || '0';
        targetWindow.dataset.prevY = targetWindow.getAttribute('data-y') || '0';

        const container = targetWindow.parentElement;
        const containerRect = container.getBoundingClientRect();
        
        const maxWidth = parseFloat(style.maxWidth) || containerRect.width;
        const maxHeight = parseFloat(style.maxHeight) || containerRect.height;
        
        const currentLeft = parseFloat(targetWindow.style.left) || 0;
        const currentTop = parseFloat(targetWindow.style.top) || 0;
        
        const centerX = (containerRect.width - maxWidth) / 2;
        const centerY = (containerRect.height - maxHeight) / 2;
        
        const offsetX = centerX - currentLeft;
        const offsetY = centerY - currentTop;

        targetWindow.style.width = `${maxWidth}px`;
        targetWindow.style.height = `${maxHeight}px`;
        targetWindow.style.transform = `translate(${offsetX}px, ${offsetY}px)`;
        
        targetWindow.setAttribute('data-x', offsetX);
        targetWindow.setAttribute('data-y', offsetY);
        
        targetWindow.classList.add("maximized");
        
        if (buttonIcon) {
            buttonIcon.innerHTML = '<i class="fa-solid fa-window-restore"></i>';
        }
    }

    // Função que restaura a janela ao tamanho anterior
    #restoreWindow(targetWindow) {
        this.#restoreWindowState(targetWindow);
    }

    // Função que "minimiza" a janela (remove do DOM mas mantém no cache)
    minimizeWindow(targetWindow) {
        const windowId = targetWindow.getAttribute("id");
        
        // Remove do mapa de janelas ativas
        if (this.#hasPages.has(windowId)) {
            this.#hasPages.delete(windowId);
        }
        
        // Remove do DOM
        targetWindow.remove();
        
        // Atualiza o estado do botão pai para unfocused
        const buttonParentId = this.#getButtonParentIdByWindow(windowId);
        if (buttonParentId) {
            const buttonParent = document.getElementById(buttonParentId);
            if (buttonParent) {
                buttonParent.classList.remove("focusButton");
                buttonParent.classList.add("unfocusButton");
            }
        }
    }

    // Helper para encontrar o botão pai de uma janela
    #getButtonParentIdByWindow(windowId) {
        for (const [buttonId, window] of this.#hasPageInButton.entries()) {
            if (window.id === windowId) {
                return buttonId;
            }
        }
        return null;
    }

    // Valida se é possível adicionar nova janela
    canAddWindow() {
        this.#canAddNewWindow = this.#hasPages.size < this.#limitNewWindows;
    }

    // Função que controla e aplica a classe de foco no botão
    focusButtonParent(buttonParentId) {
        const buttonParentSelected = document.getElementById(buttonParentId);

        if (buttonParentSelected && this.#hasPageInButton.size !== 0) {
            buttonParentSelected.classList.remove("unfocusButton");
            buttonParentSelected.classList.add("focusButton");
        }
    }

    // Remove foco de todos os botões
    #unfocusAllButtonsParents() {
        const buttonsParents = document.querySelectorAll('.buttonControlMenu');
        buttonsParents.forEach((button) => {
            button.classList.remove("unfocusButton");
            button.classList.remove("focusButton");

            if (this.#hasPageInButton.has(button.id)) {
                button.classList.add("unfocusButton");
            }
        });
    }

    // Aplica foco na janela
    handleFocus(targetWindow, buttonParentId) {
        if (targetWindow.classList.contains("unfocused")) {
            const id = targetWindow.getAttribute("id");

            if (this.#hasPages.has(id)) {
                this.#hasPages.forEach((window) => {
                    window.classList.add("unfocused");
                });
            }

            targetWindow.classList.remove("unfocused");
        }

        this.#unfocusAllButtonsParents();
        this.focusButtonParent(buttonParentId);

        targetWindow.style.zIndex = this.#zIndexFocus++;
    }

    // Movimentação da janela (desktop)
    handleMove(event) {
        const target = event.target;
        
        const x = (parseFloat(target.getAttribute('data-x')) || 0) + event.dx;
        const y = (parseFloat(target.getAttribute('data-y')) || 0) + event.dy;

        target.style.transform = `translate(${x}px, ${y}px)`;
        
        target.setAttribute('data-x', x);
        target.setAttribute('data-y', y);
    }

    // Redimensionamento da janela (desktop)
    handleResizable(event) {
        const target = event.target;
        let x = parseFloat(target.getAttribute('data-x')) || 0;
        let y = parseFloat(target.getAttribute('data-y')) || 0;

        target.style.width = event.rect.width + 'px';
        target.style.height = event.rect.height + 'px';

        x += event.deltaRect.left;
        y += event.deltaRect.top;

        target.style.transform = `translate(${x}px, ${y}px)`;
        
        target.setAttribute('data-x', x);
        target.setAttribute('data-y', y);
    }
}

// Função auxiliar para gerar conteúdo aleatório
function getRandomHtmlContent(size) {
    const contents = {
        small: `
            <h3>Informação Rápida</h3>
            <p>Este é um conteúdo breve para teste de renderização e foco.</p>
            <ul>
                <li>Item 1: Teste rápido</li>
                <li>Item 2: Exibição simples</li>
                <li>Item 3: Finalização</li>
            </ul>
            <p><strong>Status:</strong> Concluído ✅</p>
        `,
        medium: `
            <h2>Configurações Gerais</h2>
            <p>Lorem ipsum dolor sit amet, consectetur adipisicing elit. Doloribus, porro? 
            Earum cumque quidem optio, maiores labore quibusdam, recusandae at dolore deserunt perspiciatis odit ex.</p>
            <div class="config-block">
                <h4>Preferências</h4>
                <label><input type="checkbox" checked> Ativar notificações</label><br>
                <label><input type="checkbox"> Habilitar modo escuro</label><br>
                <label><input type="checkbox"> Salvar automaticamente</label>
            </div>
            <p>Pressione <kbd>Ctrl</kbd> + <kbd>S</kbd> para salvar suas configurações.</p>
        `,
        large: `
            <h2>Relatório de Teste</h2>
            <p>Lorem ipsum dolor sit amet consectetur adipisicing elit. Perspiciatis unde fugit reprehenderit laborum nostrum 
            nisi corporis dolorem atque consequatur, possimus nihil iste placeat amet incidunt, quaerat aperiam fugiat ipsa ducimus.</p>
            <table border="1" cellspacing="0" cellpadding="5" style="width:100%; text-align:center;">
                <thead>
                    <tr><th>ID</th><th>Nome</th><th>Status</th><th>Data</th></tr>
                </thead>
                <tbody>
                    <tr><td>1</td><td>Arquivo 1</td><td>✅ Sucesso</td><td>03/11/2025</td></tr>
                    <tr><td>2</td><td>Arquivo 2</td><td>⚠️ Atenção</td><td>02/11/2025</td></tr>
                    <tr><td>3</td><td>Arquivo 3</td><td>❌ Falha</td><td>01/11/2025</td></tr>
                </tbody>
            </table>
            <p>Resultados parciais exibidos acima. Use o botão <em>"Atualizar"</em> para obter novos dados.</p>
            <button>Atualizar</button>
        `,
        extraLarge: `
            <h1>Documento Extenso de Teste</h1>
            <p>Lorem ipsum dolor sit amet consectetur adipisicing elit. Facilis illo voluptates nostrum 
            inventore sequi quibusdam doloremque obcaecati, atque quas sint iste perspiciatis magni tempore.</p>
            <h3>Seção 1 — Introdução</h3>
            <p>Aliquam erat volutpat. Curabitur vel libero vel justo malesuada tincidunt.</p>
            <h3>Seção 2 — Detalhes Técnicos</h3>
            <p>Vestibulum id quam sed felis euismod tempor. Duis fringilla fermentum elit.</p>
            <ul>
                <li><strong>Teste 1:</strong> Lorem ipsum dolor sit amet.</li>
                <li><strong>Teste 2:</strong> Consectetur adipiscing elit.</li>
                <li><strong>Teste 3:</strong> Integer nec odio. Praesent libero.</li>
            </ul>
            <h3>Seção 3 — Conclusão</h3>
            <p>Donec quam felis, ultricies nec, pellentesque eu, pretium quis, sem.</p>
        `
    };

    const keys = Object.keys(contents);
    const selected = size && contents[size] ? size : keys[Math.floor(Math.random() * keys.length)];
    return contents[selected];
}

const interactJSDRM = new InteractJSDRM();

// Inicialização
document.addEventListener("DOMContentLoaded", () => {
    const testButton1 = document.getElementById("testAddWindowButton1");
    const testButton2 = document.getElementById("testAddWindowButton2");
    const testButton3 = document.getElementById("testAddWindowButton3");
    const testButton4 = document.getElementById("testAddWindowButton4");
    
    if (testButton1 && testButton2 && testButton3 && testButton4) {
        testButton1.addEventListener("click", (e) => {
            interactJSDRM.openNewWindow({
                buttonParent: e.currentTarget,
                title: "PDF Small",
                type: "testing",
                text: getRandomHtmlContent("small")
            });
        });

        testButton2.addEventListener("click", (e) => {
            interactJSDRM.openNewWindow({
                buttonParent: e.currentTarget,
                title: "PDF Medium",
                type: "testing",
                text: getRandomHtmlContent("medium")
            });
        });

        testButton3.addEventListener("click", (e) => {
            interactJSDRM.openNewWindow({
                buttonParent: e.currentTarget,
                title: "PDF Large",
                type: "testing",
                text: getRandomHtmlContent("large")
            });
        });

        testButton4.addEventListener("click", (e) => {
            interactJSDRM.openNewWindow({
                buttonParent: e.currentTarget,
                title: "PDF Extra Large",
                type: "testing",
                text: getRandomHtmlContent("extraLarge")
            });
        });
    }
});
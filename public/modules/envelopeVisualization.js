(function () {
   /*
	* createEnvelope(graphContainer, inputContainer, envelopeId)
	* Scopo:
	*   Inizializza una singola istanza del grafico "envelope" dentro il container
	*   fornito, leggendo i valori dagli input associati. Configura tema, scale,
	*   listeners, canvas e stato interno.
	* Dettagli:
	*   - Risolve la scala anisotropa per asse (settings.axisScale) da data-attr o mappa id.
	*   - Prepara settings di default (griglia, colori, titoli, padding, allineamenti).
	*   - Crea canvas e tooltip, collega gli eventi di input/resize, e lancia primo render.
	*/
    function createEnvelope(graphContainer, inputContainer, envelopeId) {
		const theme = Object.freeze({
			ok: {
				name: "ok",
				text: "#006400",            // verde scuro
				border: "#008040",          // verde medio per contorni
				background: "#FFFFFF",      // bianco puro per leggibilità
				shadow: "rgba(0,0,0,0.25)"  // ombra tenue per stacco
			},
			warning: {
				name: "warning",
				text: "#D35400",            // arancione scuro
				border: "#E67E22",          // arancione medio per contrasto
				background: "#FFFFFF",
				shadow: "rgba(0,0,0,0.25)"
			},
			error: {
				name: "error",
				text: "#B00020",            // rosso scuro
				border: "#FF3B30",          // rosso brillante
				background: "#FFFFFF",
				shadow: "rgba(0,0,0,0.25)"
			},
			neutral: {
				name: "neutral",
				text: "#404040",            // grigio neutro tecnico
				border: "#5A5A5A",          // bordo leggermente più chiaro
				background: "#FFFFFF",      // fondo bianco per coerenza visiva
				shadow: "rgba(0,0,0,0.15)"  // ombra più soft
			}
		});
		
		const AXIS_SCALE_BY_ID = {
			"1": { x: 1, y: 1 },   			// envelope 1 → 1:1
			"2": { x: 4, y: 1 },   			// envelope 2 → 4:1
			"3": { x: 4, y: 1 },   			// envelope 3 → 4:1
			"default": { x: 1, y: 1 }
		};

		const defaultSettings = {
            lineColor: theme.ok,
            lineWidth: 1.5,
            pointSize: 3.5,
            showGrid: true,
            snapToGrid: false,
            gridSize: 1,
            zoomIncrement: 1.2,
            minZoom: 0.2,
            maxZoom: 100,
            showCoordinatesTooltip: false,
			gridColor: '#e5e5e5',
			gridLabelColor: '#6B6B6B',
			gridLabelFont: "12px Roboto",
			xTitle: "Title X axis",
			xUnit: "Unit X axis",
			yTitle: "Title Y axis",
			yUnit: "Unit Y axis",
			axisTitleFont: "13px Roboto",
			axisTitleColor: "#333",
			labelSkip: 1,
			axisScale: { x: 1, y: 1 }, 		// esempio, se 2:1 → X “più grande”, Y “normale”
			paddingPx: 150,
			hitRadiusPx: 8,   				// raggio di "presa" in pixel canvas (UX coerente a qualunque zoom/ratio)
			decimals: 1,
			innerPadPx: 20,
			reserveFreePointLabel: true,
			tickTargetPx: 50,
			hAlign: 'center',
			vAlign: 'center'
        };

        let points = [];
        let freePoint = { x: 150, y: 150 };
        let settings = { ...defaultSettings };
        let canvasState = {
            scaleX: 1,
			scaleY: 1,
            offset: { x: 0, y: 0 },
            isDragging: false,
            selectedPointIndex: -1,
            isDraggingFreePoint: false,
            startDragPos: { x: 0, y: 0 }
        };

        let canvas = null;
        let ctx = null;
        let canvasWidth = 0;
        let canvasHeight = 0;
        let tooltip = null;
		
		settings.axisScale = resolveAxisScale(envelopeId, graphContainer);
		
		// --- defaults ---
		settings.axisScale = settings.axisScale || { x: 2, y: 1 }; 					// es. 2:1
		settings.decimals   = settings.decimals ?? 1;              					// per label numeriche
		settings.innerPadPx = settings.innerPadPx ?? 8;            					// margine interno fra grafico e canvas
		settings.reserveFreePointLabel = settings.reserveFreePointLabel ?? true; 	// include bbox label freePoint
		settings.tickTargetPx = settings.tickTargetPx ?? 50;       					// px tra linee griglia (per stimare step)
		settings.axisTitleFont = settings.axisTitleFont || "13px Arial";
		settings.gridLabelFont = settings.gridLabelFont || "12px Arial";

	   /*
		* getColorByValue(value)
		* Scopo:
		*   Tradurre un "valore di stato" in una palette cromatica (tema) per freePoint/label.
		* Dettagli:
		*   - Per envelope specifici può mappare 0->ok, ±1->warning, altro->error.
		*   - In assenza di stato diagnostico, ritorna "neutral".
	    */
		function getColorByValue(value) {
			const v = parseFloat(value);
			// --- distinguo in base all'envelope ---
			// --- TODO ---
			// --- impostare il tema voluto dentro HTML container ---			
			if (envelopeId == 1) {
				// --- envelope unità ---
				if (v === 0) return theme.ok;
				if (v === 1 || v === -1) return theme.warning;
				return theme.error;
			} else {
				// --- envelope circuito ---
				/*
				if (v > 0) return theme.ok;
				return theme.error;
				*/
				return theme.neutral;
			}
		}
		
	   /*
		* parseAxisScaleFromDataset(el)
		* Scopo:
		*   Leggere i fattori di scala anisotropi da attributi data (data-axis-scale-x/y).
		* Dettagli:
		*   - Ritorna {x, y} se validi, altrimenti null.
	    */		
		function parseAxisScaleFromDataset(el) {
			const ax = parseFloat(el.dataset.axisScaleX);
			const ay = parseFloat(el.dataset.axisScaleY);
			return Number.isFinite(ax) || Number.isFinite(ay)
				? { x: Number.isFinite(ax) ? ax : 1, y: Number.isFinite(ay) ? ay : 1 }
				: null;
		}

	   /*
		* resolveAxisScale(envelopeId, graphContainer)
		* Scopo:
		*   Decidere la scala degli assi con priorità: data-attributes -> mappa per id -> default.
	    */
		function resolveAxisScale(envelopeId, graphContainer) {
			// 1) data-attributes (override per pagina)
			const fromDom = parseAxisScaleFromDataset(graphContainer);
			if (fromDom) return fromDom;

			// 2) mappa di progetto
			const preset = AXIS_SCALE_BY_ID[String(envelopeId)];
			if (preset) return preset;

			// 3) fallback
			return AXIS_SCALE_BY_ID.default;
		}

	   /*
		* findInputs()
		* Scopo:
		*   Scansiona input[data-env] per costruire:
		*   - palette (color),
		*   - freePoint (wp-x/wp-y),
		*   - vertici dell’envelope (coppie id-x/id-y).
		* Dettagli:
		*   - Aggrega le coordinate con una Map per ogni vertexId.
		*   - Valida i numeri (Number.isFinite), scarta i vertici incompleti.
		*   - Ordina i vertici in base alla parte numerica dell’id (v1, v2, …).
	    */
        function findInputs() {
            const allInputs = inputContainer.querySelectorAll('input[data-env]');
            const vertexMap = new Map();

            allInputs.forEach(input => {
                const envValue = input.getAttribute('data-env');
                const cleanedEnvValue = envValue.replace(`env${envelopeId}-`, '');

                if (cleanedEnvValue === 'color') {
                    const colorValue = input.value;
                    settings.lineColor = getColorByValue(colorValue);
                } else if (cleanedEnvValue === 'wp-x') {
					// --- rendo più robusto il controllo rispetto a input = 0 --- 
					const val = parseFloat(input.value);
					freePoint.x = Number.isFinite(val) ? val : 150;
                    freePoint.xInput = input;
                } else if (cleanedEnvValue === 'wp-y') {
					// --- rendo più robusto il controllo rispetto a input = 0 ---
					const val = parseFloat(input.value);
					freePoint.y = Number.isFinite(val) ? val : 150;
                    freePoint.yInput = input;
                } else if (cleanedEnvValue && cleanedEnvValue.includes('-')) {
                    const parts = cleanedEnvValue.split('-');
                    if (parts.length === 2) {
                        const vertexId = parts[0];
                        const coordinate = parts[1];
                        if (!vertexMap.has(vertexId)) {
                            vertexMap.set(vertexId, { id: vertexId });
                        }
                        const vertex = vertexMap.get(vertexId);
						if (coordinate === 'x') {
							const n = parseFloat(input.value);
							vertex.x = Number.isFinite(n) ? n : undefined;
							vertex.xInput = input;
						} else if (coordinate === 'y') {
							const n = parseFloat(input.value);
							vertex.y = Number.isFinite(n) ? n : undefined;
							vertex.yInput = input;
						}
                    }
                }
            });

			// --- controllo che i punti siano completi, sia X che Y ---
//			for (const [id, v] of vertexMap.entries()) {
//				const missing = [];
//				if (v.x === undefined) missing.push("x");
//				if (v.y === undefined) missing.push("y");
//				if (missing.length) {
//					console.warn(`Vertice incompleto "${id}": manca ${missing.join(" e ")}`, v);
//				}
//			}
			
			// --- aggiungo ordinamento dei punti ---
			points = Array.from(vertexMap.values())
				.filter(vertex => Number.isFinite(vertex.x) && Number.isFinite(vertex.y))
				.sort((a, b) => {
					const na = parseInt((a.id || '').replace(/\D/g, ''), 10) || 0;
					const nb = parseInt((b.id || '').replace(/\D/g, ''), 10) || 0;
					return na - nb;
				});
        }

	   /*
		* setupInputsObserver()
		* Scopo:
		*   Collega i listener agli input per aggiornare in tempo reale il disegno.
		* Dettagli:
		*   - All'evento 'input' rifà: findInputs() -> fitToPoints() -> drawCanvas().
	    */
        function setupInputsObserver() {
            const allInputs = inputContainer.querySelectorAll('input[data-env]');
            allInputs.forEach(input => {
                input.addEventListener('input', () => {
                    findInputs();
                    fitToPoints();  
                    drawCanvas();
                });
            });

            let previousValues = new Map();
            allInputs.forEach(input => {
                previousValues.set(input, input.value);
            });

            setInterval(() => {
                allInputs.forEach(input => {
                    const currentValue = input.value;
                    const previousValue = previousValues.get(input);
                    if (currentValue !== previousValue) {
                        previousValues.set(input, currentValue);
                        findInputs();
                        fitToPoints(); 
                        drawCanvas();
                    }
                });
            }, 100);
        }

	   /*
		* createCanvas()
		* Scopo:
		*   Creare il <canvas> e la <div> tooltip, impostare dimensioni e listener.
		* Dettagli:
		*   - Canvas dimensionato al 100% del container (responsivo).
		*   - Aggiunge handler mousemove e il resize listener su window.
	    */
        function createCanvas() {
            canvas = document.createElement('canvas');
            canvas.className = 'envelope-canvas';
            ctx = canvas.getContext('2d');
            graphContainer.appendChild(canvas);

            tooltip = document.createElement('div');
            tooltip.style.cssText = `
                position: absolute;
                display: none;
                background: rgba(0, 0, 0, 0.8);
                color: white;
                padding: 5px 10px;
                border-radius: 4px;
                font-size: 14px;
                pointer-events: none;
                z-index: 1000;
            `;
            graphContainer.appendChild(tooltip);

            canvas.style.cssText = `
                display: block;
                width: 100%;
                height: 100%;
                cursor: default; /* Alterado: Define o cursor padrão, removendo 'grab' */
            `;
           
            canvas.addEventListener('mousemove', handleMouseMove); 
         
            window.addEventListener('resize', resizeCanvas);
        }

	   /*
		* resizeCanvas()
		* Scopo:
		*   Ridimensiona il buffer del canvas (HiDPI) e ripristina la trasformazione in CSS px.
		* Dettagli:
		*   - Usa DPR per canvas.width/height (device px), ma disegna in CSS px con setTransform.
		*   - Richiama fitToPoints() e drawCanvas() per riallineare contenuto alla nuova size.
	    */
        function resizeCanvas() {		
			const dpr = window.devicePixelRatio || 1;
			canvasWidth  = graphContainer.clientWidth;
			canvasHeight = graphContainer.clientHeight;
			canvas.width  = Math.max(1, Math.floor(canvasWidth  * dpr));
			canvas.height = Math.max(1, Math.floor(canvasHeight * dpr));
			canvas.style.width  = `${canvasWidth}px`;
			canvas.style.height = `${canvasHeight}px`;
			ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
         
            fitToPoints(); 
            drawCanvas();
        }
		
	   /*
		* cssCanvasSize()
		* Scopo:
		*   Restituire larghezza/altezza del canvas in CSS px, compensando il DPR.
	    */
        function cssCanvasSize() {
            const dpr = window.devicePixelRatio || 1;
            return { w: canvas.width / dpr, h: canvas.height / dpr };
        }

	   /*
		* worldToCanvas(x, y)
		* Scopo:
		*   Convertire coordinate "mondo" (unità dati) in coordinate canvas (CSS px).
		* Dettagli:
		*   - Applica scaleX/scaleY e offset.
		*   - Sistema di riferimento canvas: y cresce verso il basso
		*     -> cy = CH - (y*scaleY + offsetY).
	    */
        function worldToCanvas(x, y) {
            const { h: CH } = cssCanvasSize();
            const cx = x * canvasState.scaleX + canvasState.offset.x;
            const cy = CH - (y * canvasState.scaleY + canvasState.offset.y);
            return { x: cx, y: cy };
        }	

	   /*
		* canvasToWorld(cx, cy)
		* Scopo:
		*   Convertire coordinate canvas (CSS px) in coordinate mondo (unità dati).
		* Dettagli:
		*   - Inversione della formula in worldToCanvas, tenendo conto dell’asse Y invertito.
	    */
        function canvasToWorld(cx, cy) {
            const { h: CH } = cssCanvasSize();
            const x = (cx - canvasState.offset.x) / canvasState.scaleX;
            const y = (CH - cy - canvasState.offset.y) / canvasState.scaleY;
            return { x, y };
        } 		

	   /*
		* handleMouseMove(event)
		* Scopo:
		*   Aggiornare coordinate mouse, stato di hover e tooltip, quindi ridisegnare se serve.
		* Dettagli:
		*   - Usa offsetX/offsetY (CSS px).
		*   - Esegue hit-test su vertici e freePoint (raggio in px costante).
		*   - Mostra tooltip con coordinate convertite, se abilitata.
	    */
        function handleMouseMove(event) {
//            const rect = canvas.getBoundingClientRect();
//            const mouseX = event.clientX - rect.left;
//            const mouseY = event.clientY - rect.top;
			const mouseX = event.offsetX;
			const mouseY = event.offsetY;
            canvasState.mousePos = { x: mouseX, y: mouseY };

            const hoverPointIndex = findPointAt(mouseX, mouseY);
            const isHoveringFreePoint = isPointNear(mouseX, mouseY, freePoint);
            canvasState.hoverPointIndex = hoverPointIndex;
            canvasState.isHoveringFreePoint = isHoveringFreePoint;

            if (settings.showCoordinatesTooltip) {
                if (hoverPointIndex !== -1) {
                    const point = points[hoverPointIndex];
                    // 1. OBTÉM A POSIÇÃO DO PONTO NO CANVAS
                    const canvasPos = worldToCanvas(point.x, point.y);
                    // 2. PASSA AS COORDENADAS DO PONTO
                    showTooltip(canvasPos.x, canvasPos.y, `(${point.x.toFixed(2)}, ${point.y.toFixed(2)})`);
                } else if (isHoveringFreePoint) {
                    const canvasPos = worldToCanvas(freePoint.x, freePoint.y);
                    showTooltip(canvasPos.x, canvasPos.y, `(${freePoint.x.toFixed(2)}, ${freePoint.y.toFixed(2)})`);
                } else {
                    hideTooltip();
                }
            } else {
                hideTooltip();
            }

            canvas.style.cursor = 'default'; 

            if (canvasState.hoverPointIndex !== hoverPointIndex || canvasState.isHoveringFreePoint !== isHoveringFreePoint) {
                drawCanvas(); 
            }
        }

	   /*
		* findPointAt(cx, cy)
		* Scopo:
		*   Restituire l’indice del vertice sotto al mouse, usando raggio costante in px.
		* Dettagli:
		*   - Converte ogni vertice in canvas e confronta distanza euclidea in px.
	    */
		function findPointAt(cx, cy) {   		// cx, cy = coordinate mouse in pixel canvas (CSS px)
			const r  = settings.hitRadiusPx;
			const r2 = r * r;

			for (let i = 0; i < points.length; i++) {
				const p = worldToCanvas(points[i].x, points[i].y);
				const dx = cx - p.x, dy = cy - p.y;
				if (dx*dx + dy*dy <= r2) return i;
			}
			return -1;
		}

	   /*
		* isPointNear(cx, cy, worldPoint)
		* Scopo:
		*   Verificare se il mouse è vicino a un punto specifico (es. freePoint).
		* Dettagli:
		*   - Stessa logica di findPointAt, ma su un solo punto.
	    */
		function isPointNear(cx, cy, worldPoint) {
			const r  = settings.hitRadiusPx;
			const r2 = r * r;
			const p  = worldToCanvas(worldPoint.x, worldPoint.y);
			const dx = cx - p.x, dy = cy - p.y;
			return (dx*dx + dy*dy) <= r2;
		}
 
	   /*
		* showTooltip(x, y, content)
		* Scopo:
		*   Visualizzare la tooltip testuale in posizione relativa al container.
		* Dettagli:
		*   - Posiziona con left/top in CSS px (senza sommare rect.left/top della pagina).
		*   - Allinea centrando orizzontalmente il testo sopra/sotto il cursore.
	    */ 
        function showTooltip(x, y, content) {
            if (!tooltip) return;
//            const rect = canvas.getBoundingClientRect();

            tooltip.textContent = content;
            tooltip.style.display = 'block';

            
            const tooltipRect = tooltip.getBoundingClientRect();

            // Deslocamento Fixo
            const xOffset = -(tooltipRect.width / 2); 
            const yOffset = settings.pointSize + 10;  

//            tooltip.style.left = `${x + rect.left + xOffset}px`;
//            tooltip.style.top = `${y + rect.top + yOffset}px`;
            tooltip.style.left = `${x + xOffset}px`;
            tooltip.style.top = `${y + yOffset}px`;
        }

	   /*
		* hideTooltip()
		* Scopo:
		*   Nascondere la tooltip.
	    */
        function hideTooltip() {
            if (tooltip) {
                tooltip.style.display = 'none';
            }
        }

	   /*
		* drawCanvas()
		* Scopo:
		*   Comporre il frame: pulizia -> griglia -> titoli/assi -> envelope -> punti/label.
		* Dettagli:
		*   - clearRect su tutto il canvas (CSS px).
		*   - Griglia con passo in unità mondo (fixed world step).
	    */
        function drawCanvas() {
            const { w: CW, h: CH } = cssCanvasSize();
            ctx.clearRect(0, 0, CW, CH);			
            if (settings.showGrid) {			
				// --- passo fisso in mondo ---
				// distinguo il passo in base al tipo di envelope:
				// - passo 5 per unità
				// - passo 2 per circuito
				// --- TODO ---
				// --- impostare il passo della griglia dentro HTML container ---
				let envelopeStep = 2;
				if (envelopeId == 1) {
					envelopeStep = 5;
				} else {
					envelopeStep = 2;
				}
				drawGridFixedWorldStep(envelopeStep);
            }
			drawAxisTitles();
            drawAxes();
            drawEnvelope();
            drawPoints();
        }

	   /*
		* drawGrid()
		* Scopo:
		*   Esempio di griglia a passo fisso in pixel (non usata nel render principale).
		* Dettagli:
		*   - Lasciata come riferimento: disegna linee ogni N px e label corrispondenti.
	    */
        function drawGrid() {
			const gridSizeX = settings.gridSize * canvasState.scaleX;
			const gridSizeY = settings.gridSize * canvasState.scaleY;
            ctx.strokeStyle = '#e2e8f0';
            ctx.lineWidth = 0.5;
            const originCanvas = worldToCanvas(0, 0);
            const startX = originCanvas.x % gridSizeX;
            const startY = originCanvas.y % gridSizeY;
            for (let x = startX; x < canvasWidth; x += gridSizeX) {
                ctx.beginPath();
                ctx.moveTo(x, 0);
                ctx.lineTo(x, canvasHeight);
                ctx.stroke();
            }
            for (let y = startY; y < canvasHeight; y += gridSizeY) {
                ctx.beginPath();
                ctx.moveTo(0, y);
                ctx.lineTo(canvasWidth, y);
                ctx.stroke();
            }
        }

	   /*
		* drawAxes()
		* Scopo:
		*   (Opzionale) Disegnare gli assi X e Y (valore 0) nella scena.
		* Dettagli:
		*   - Attualmente disattivata; utile se vuoi mostrare gli assi cartesiani.
		*/
        function drawAxes() {
            const origin = worldToCanvas(0, 0);
            ctx.strokeStyle = '#64748b';
            ctx.lineWidth = 1;
            
            /* --- Non fa piu vedere le linee degli assi --- 
            ctx.beginPath();
            ctx.moveTo(0, origin.y);
            ctx.lineTo(canvasWidth, origin.y);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(origin.x, 0);
            ctx.lineTo(origin.x, canvasHeight);
            ctx.stroke();
            */
           
            /* --- Non fa piu vedere X e Y nel canva ---
            if (canvasState.scale > 0.5) {
                ctx.fillStyle = '#64748b';
                ctx.font = '12px Arial';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'top';
                ctx.fillText('X', canvasWidth - 20, origin.y + 5);
                ctx.textAlign = 'left';
                ctx.textBaseline = 'middle';
                ctx.fillText('Y', origin.x + 5, 20);
            }
            */
        }

	   /*
		* drawEnvelope()
		* Scopo:
		*   Disegnare il poligono (envelope) usando i vertici raccolti.
		* Dettagli:
		*   - Richiede almeno 3 punti completi.
		*   - Traccia una linea chiusa con stroke (colore/spessore da settings).
	    */
        function drawEnvelope() {
            if (points.length < 3) return;
            const { lineColor, lineWidth } = settings;
			// --- disegno envelope sempre in black ---
            ctx.strokeStyle = '#404040';
            ctx.lineWidth = lineWidth;
            ctx.beginPath();
            const firstPointCanvas = worldToCanvas(points[0].x, points[0].y);
            ctx.moveTo(firstPointCanvas.x, firstPointCanvas.y);
            for (let i = 1; i < points.length; i++) {
                const pointCanvas = worldToCanvas(points[i].x, points[i].y);
                ctx.lineTo(pointCanvas.x, pointCanvas.y);
            }
            ctx.closePath();
            ctx.stroke();
        }

	   /*
		* drawPoints()
		* Scopo:
		*   Disegnare i vertici dell’envelope e il freePoint con il relativo stile.
		* Dettagli:
		*   - Vertici: cerchi pieni scuri con bordo chiaro.
		*   - FreePoint: anello + pallino con colori dal tema corrente.
		*   - Genera il testo della label del freePoint e la disegna.
	    */
        function drawPoints() {
            const { pointSize } = settings;
			
			// --- cache per frame ---
			const colorInput = inputContainer.querySelector('input[data-env^="env"][data-env$="-color"]');
			// const currentColor = getColorByValue(colorInput ? colorInput.value : '0');
			const colorSet = getColorByValue(colorInput ? colorInput.value : '0');
			
            for (let i = 0; i < points.length; i++) {
                const canvasPos = worldToCanvas(points[i].x, points[i].y);
                ctx.beginPath();
                ctx.arc(canvasPos.x, canvasPos.y, pointSize, 0, Math.PI * 2);
				// --- disegno envelope sempre in black ---
                ctx.fillStyle = '#404040';
                ctx.fill();
                ctx.strokeStyle = 'white';
                ctx.lineWidth = 1.5;
                ctx.stroke();
            }
			
			// --- cambio il colore del freePoint ---
            const freePointCanvas = worldToCanvas(freePoint.x, freePoint.y);

			// cerchio esterno
			ctx.beginPath();
			ctx.arc(freePointCanvas.x, freePointCanvas.y, 6, 0, 2 * Math.PI);
			ctx.strokeStyle = colorSet.text;
			ctx.lineWidth = 1.5;
			ctx.stroke();

			// cerchio interno
			ctx.beginPath();
			ctx.arc(freePointCanvas.x, freePointCanvas.y, 2, 0, 2 * Math.PI);
			ctx.fillStyle = colorSet.text;
			ctx.fill();
			
			// --- mostra coordinate accanto ---
			// --- numero di cifre decimali in base a envelope ---
			// - 1 cifra su envelope unità (temperature)
			// - 2 cifre su envelope circuito (pressioni)
			// --- TODO ---
			// --- impostare cifre decimali dentro HTML container ---			
			const decimalDigits = Number(envelopeId) === 1 ? 1 : 2; // confronto robusto
			const label = `${freePoint.x.toFixed(decimalDigits)}, ${freePoint.y.toFixed(decimalDigits)}`;
						
			drawFreePointLabel(freePointCanvas.x, freePointCanvas.y, label, colorSet);		
        }

	   /*
		* drawFreePointLabel(fpCanvasX, fpCanvasY, labelText, labelColorSet)
		* Scopo:
		*   Disegnare la label del freePoint con rettangolo arrotondato, bordo, ombra e testo.
		* Dettagli:
		*   - Posizione predefinita: destra in alto rispetto al punto (pad).
		*   - Effettua il clamp per evitare overflow su lato destro/superiore.
		*   - Lo sfondo può essere reso semi-trasparente via settings.freePointLabelOpacity.
	    */
		function drawFreePointLabel(fpCanvasX, fpCanvasY, labelText, labelColorSet) {
			ctx.save();

			const pad = 6;                 // distanza punto -> etichetta
			const margin = 2;              // distanza dal bordo canvas
			const fontSize = 14;
			const radius = 5;              // angolo arrotondato
			const textPadX = 6;            // padding interno rettangolo
			const textPadY = 6;

			ctx.font = `${fontSize}px Roboto`;
			const metrics = ctx.measureText(labelText);
			const textW = Math.ceil(metrics.width);
			const textH = fontSize + 2 * textPadY;

			// --- posizione di default: destra-alto del punto ---
			let x = fpCanvasX + pad;
			let y = fpCanvasY - pad;
			let textAlign = 'left';
			let textBaseline = 'bottom';

			// --- sposta se esce dal bordo destro ---
//			if (x + textW + textPadX * 2 + margin > canvas.width) {
//				x = fpCanvasX - pad;
//				textAlign = 'right';
//			}
			// --- sposta se esce in alto ---
//			if (y - textH - margin < 0) {
//				y = fpCanvasY + pad;
//				textBaseline = 'top';
//			}

			// --- coordinate rettangolo ---
			const rectX = textAlign === 'left' ? x : x - textW - textPadX * 2;
			const rectY =
				textBaseline === 'bottom'
				? y - textH
				: y;
			const rectW = textW + textPadX * 2;
			const rectH = textH;

			// --- disegna rettangolo con angoli arrotondati ---
			ctx.beginPath();
			ctx.moveTo(rectX + radius, rectY);
			ctx.lineTo(rectX + rectW - radius, rectY);
			ctx.quadraticCurveTo(rectX + rectW, rectY, rectX + rectW, rectY + radius);
			ctx.lineTo(rectX + rectW, rectY + rectH - radius);
			ctx.quadraticCurveTo(rectX + rectW, rectY + rectH, rectX + rectW - radius, rectY + rectH);
			ctx.lineTo(rectX + radius, rectY + rectH);
			ctx.quadraticCurveTo(rectX, rectY + rectH, rectX, rectY + rectH - radius);
			ctx.lineTo(rectX, rectY + radius);
			ctx.quadraticCurveTo(rectX, rectY, rectX + radius, rectY);
			ctx.closePath();

			ctx.fillStyle = labelColorSet.background; // sfondo quasi bianco
			ctx.strokeStyle = labelColorSet.border;   // bordo tenue
			ctx.shadowColor = labelColorSet.shadow;
			ctx.shadowBlur = 4;
			ctx.shadowOffsetX = 2;
			ctx.shadowOffsetY = 2;

			ctx.fill();
			ctx.stroke();

			// --- disegna testo sopra il rettangolo ---
			// testo
			ctx.shadowColor = "transparent";  // disabilita ombra per il testo			
			ctx.fillStyle = labelColorSet.text;
			ctx.textAlign = textAlign;
			ctx.textBaseline = textBaseline;
			const textX = textAlign === 'left' ? x + textPadX : x - textPadX;
			const textY = textBaseline === 'bottom' ? y - textPadY : y + textPadY + fontSize;
			ctx.fillText(labelText, textX, textY);

			ctx.restore();
		}

	   /*
		* updateInputsFromPoints()
		* Scopo:
		*   (Facoltativo) Aggiornare i campi input con i valori dei vertici calcolati.
		* Dettagli:
		*   - Utile per sincronizzare UI quando i punti vengono manipolati via grafico.
	    */
        function updateInputsFromPoints() {
            points.forEach((point) => {
                if (point.xInput) {
                    point.xInput.value = Math.round(point.x);
                }
                if (point.yInput) {
                    point.yInput.value = Math.round(point.y);
                }
            });
            if (freePoint.xInput) {
                freePoint.xInput.value = Math.round(freePoint.x);
            }
            if (freePoint.yInput) {
                freePoint.yInput.value = Math.round(freePoint.y);
            }
        }

	   /*
		* niceStep(raw)
		* Scopo:
		*   Generare uno step "gradevole" (1–2–5 × 10^k) a partire da un passo grezzo.
		* Dettagli:
		*   - Usato per posizionare le tacche/etichette con densità visiva costante.
	    */		
		function niceStep(raw) { // 1–2–5 * 10^k
			const pow10 = 10 ** Math.floor(Math.log10(raw));
			const unit = raw / pow10;
			const nice = unit < 1.5 ? 1 : unit < 3 ? 2 : unit < 7 ? 5 : 10;
			return nice * pow10;
		}

	   /*
		* measureTextWidth(text, font)
		* Scopo:
		*   Misurare la larghezza del testo con il font indicato o corrente.
		* Dettagli:
		*   - Restituisce una misura in CSS px (coerente con i disegni).
	    */
		function measureTextWidth(text, font) {
			ctx.save();
			if (font) ctx.font = font;
			const w = Math.ceil(ctx.measureText(text).width);
			ctx.restore();
			return w;
		}

	   /*
		* fitToPoints() / fitToPointsTight()
		* Scopo:
		*   Calcolare scala e offset per adattare l’envelope all’area utile, con riserva
		*   degli spazi per label e titoli, e allineamento configurabile.
		* Dettagli:
		*   - BBox mondo: min/max di X e Y (incluso freePoint).
		*   - Gutter: margini per titoli (asse X/Y), label di griglia e label del freePoint.
		*   - Scala anisotropa: scaleX/scaleY = base×axisScale.x/y (es. 2:1).
		*   - Allineamento: hAlign ('min'|'center'|'max') e vAlign ('min'|'center'|'max').
		*   - Tutte le misure di layout in CSS px (usa cssCanvasSize()).
	    */
		function fitToPoints() {
			// --- 0) BBox mondo dell’envelope (+ freePoint) ---
			let minX = +Infinity, minY = +Infinity, maxX = -Infinity, maxY = -Infinity;
			for (const p of [...points, freePoint]) {
				if (!Number.isFinite(p.x) || !Number.isFinite(p.y)) continue;
				if (p.x < minX) minX = p.x; if (p.x > maxX) maxX = p.x;
				if (p.y < minY) minY = p.y; if (p.y > maxY) maxY = p.y;
			}
			if (!isFinite(minX)) return;

			// --- 1) Primo passaggio: stima scale provvisoria con gutter base ---
			const titleX = settings.xTitle ? `${settings.xTitle}${settings.xUnit ? ` [${settings.xUnit}]` : ""}` : "";
			const titleY = settings.yTitle ? `${settings.yTitle}${settings.yUnit ? ` [${settings.yUnit}]` : ""}` : "";

			const titleH = parseInt(settings.axisTitleFont.match(/\d+/)?.[0] || "13", 10);
			const labelH = parseInt(settings.gridLabelFont.match(/\d+/)?.[0] || "11", 10);

			// --- Gutter base (px) — già “fuori” dalle label di griglia ---
			let gutterLeft   = 8;                 // aumenteremo con la larghezza massima label Y
			let gutterRight  = 8;
			let gutterTop    = 8;
			let gutterBottom = 8;

			// --- Spazio titoli (fuori dalle label) ---
			if (titleX) gutterBottom += (titleH + 6);
			if (titleY) gutterLeft   += (titleH + 6); // ruotato, “altezza” diventa larghezza

			// --- 2) Calcolo scale provvisorie (uso aspect anisotropo) ---
			const ax = settings.axisScale.x ?? 1;
			const ay = settings.axisScale.y ?? 1;

			// --- riserva almeno lo spazio per le label numeriche (stima iniziale con min/max) ---
			const fmt = (v) => (Math.abs(v) >= 1 ? v.toFixed(0) : v.toFixed(settings.decimals));
			const yMinLbl = fmt(minY), yMaxLbl = fmt(maxY);
			gutterLeft += Math.max(measureTextWidth(yMinLbl, settings.gridLabelFont),
								   measureTextWidth(yMaxLbl, settings.gridLabelFont)) + 6;
			gutterBottom += labelH + 6;

            const { w: CW, h: CH } = cssCanvasSize();
            let availW = Math.max(1, CW - gutterLeft - gutterRight - settings.innerPadPx*2);
            let availH = Math.max(1, CH - gutterTop  - gutterBottom - settings.innerPadPx*2);

			const worldW = Math.max(1e-9, maxX - minX);
			const worldH = Math.max(1e-9, maxY - minY);

			const baseX = availW / (worldW * ax);
			const baseY = availH / (worldH * ay);
			let base = Math.max(1e-9, Math.min(baseX, baseY));
			canvasState.scaleX = base * ax;
			canvasState.scaleY = base * ay;

			// --- 3) Secondo passaggio: ricalcola gutter in modo più preciso generando i tick ---
			// --- (manteniamo ~50px tra griglie) ---
			const stepWorldX = niceStep(settings.tickTargetPx / canvasState.scaleX);
			const stepWorldY = niceStep(settings.tickTargetPx / canvasState.scaleY);

			// --- max larghezza etichette Y reale ---
			let maxYLabelW = 0;
			for (let y = Math.ceil(minY / stepWorldY) * stepWorldY; y <= maxY; y += stepWorldY) {
				const s = fmt(y);
				maxYLabelW = Math.max(maxYLabelW, measureTextWidth(s, settings.gridLabelFont));
			}

			// --- con questa larghezza aggiorniamo davvero i gutter ---
			gutterLeft = 8 + (titleY ? (titleH + 6) : 0) + maxYLabelW + 6;
			gutterBottom = 8 + (titleX ? (titleH + 6) : 0) + labelH + 6;

			// --- (opz.) includi la bbox della label del freePoint se la tieni visibile sempre ---
			if (settings.reserveFreePointLabel && Number.isFinite(freePoint.x) && Number.isFinite(freePoint.y)) {
				// --- stima rettangolo label accanto al punto (destra in alto) ---
				ctx.save(); ctx.font = "14px Roboto";
				const lab = `(${freePoint.x.toFixed(settings.decimals)}, ${freePoint.y.toFixed(settings.decimals)})`;
				const w = Math.ceil(ctx.measureText(lab).width) + 16; // padding interno
				const h = 14 + 14; // approx
				ctx.restore();

				const p = worldToCanvas(freePoint.x, freePoint.y);
				const overflowRight  = Math.max(0, p.x + 8 + w - (CW  - 8))
				const overflowLeft   = Math.max(0, -(p.x - 8 - w)); // opzionale se label può stare a sx
				const overflowBottom = Math.max(0, p.y + 8 + h - (CH - gutterBottom - settings.innerPadPx));
				const overflowTop    = Math.max(0, (h + 8) - p.y);  // riserva pixel sopra se label in alto

				gutterRight  += overflowRight;
				gutterLeft   += overflowLeft;
				gutterBottom += overflowBottom;
				gutterTop    += overflowTop;
			}

			// --- 4) Scale finali con gutter definitivo ---
			availW = Math.max(1, CW - gutterLeft - gutterRight - settings.innerPadPx*2);
			availH = Math.max(1, CH - gutterTop  - gutterBottom - settings.innerPadPx*2);

			const baseX2 = availW / (worldW * ax);
			const baseY2 = availH / (worldH * ay);
			base = Math.max(1e-9, Math.min(baseX2, baseY2));

			canvasState.scaleX = base * ax;
			canvasState.scaleY = base * ay;

			// --- 5) Offset: allinea min → bordo interno sinistro/basso ---
			const innerLeft   = gutterLeft  + settings.innerPadPx;
			const innerBottom = gutterBottom + settings.innerPadPx;
			const innerTop    = gutterTop    + settings.innerPadPx;

			// --- mapping: cx = x*scaleX + offsetX; cy = CH - (y*scaleY + offsetY) ---
			// --- gestione slack orizzontale (spazio in più) ---
			const contentWpx = (maxX - minX) * canvasState.scaleX; // hAlign
			const contentHpx = (maxY - minY) * canvasState.scaleY; // vAlign		
			const slackXpx   = Math.max(0, availW - contentWpx);   // px “liberi” in orizzontale
			const slackYpx   = Math.max(0, availH - contentHpx);
			// --- allineamento orizzontale: 'min' (sinistra), 'center', 'max' (destra) ---
			const hAlign = (settings.hAlign === 'center' || settings.hAlign === 'max') ? settings.hAlign : 'min';
			if (hAlign === 'max') {
				// --- allinea il bordo destro del bbox al bordo interno destro → niente spazio a destra ---
				canvasState.offset.x = innerLeft + slackXpx - minX * canvasState.scaleX;
			} else if (hAlign === 'center') {
				// --- distribuisci lo slack a metà ---
				canvasState.offset.x = innerLeft + (slackXpx / 2) - minX * canvasState.scaleX;
			} else {
				// --- 'min' → aderisci a sinistra (comportamento attuale) ---
				canvasState.offset.x = innerLeft - minX * canvasState.scaleX;
			}
			
			// --- verticale: lasciamo minY aderente al bordo interno basso ---
//			canvasState.offset.y = innerBottom - minY * canvasState.scaleY;

			// allineamento verticale
			const vAlign = (settings.vAlign === 'center' || settings.vAlign === 'max') ? settings.vAlign : 'min';
			if (vAlign === 'max') {
				// aderisce in alto → elimina spazio sopra
				canvasState.offset.y = (CH - innerTop) - maxY * canvasState.scaleY;
			} else if (vAlign === 'center') {
				// distribuisce lo slack in alto e in basso
				canvasState.offset.y = innerBottom + (slackYpx / 2) - minY * canvasState.scaleY;
			} else {
				// 'min' → aderisce in basso
				canvasState.offset.y = innerBottom - minY * canvasState.scaleY;
			}
			
			// salva i gutter per usarli nei titoli
			canvasState.gutter = { left: gutterLeft, right: gutterRight, top: gutterTop, bottom: gutterBottom };

			// --- Log diagnostico: dimensioni canvas e parametri verticali ---
/*
			console.log({
				canvasSizeCSS: { width: CW, height: CH },
				gutters: {
					top: gutterTop,
					bottom: gutterBottom,
					left: gutterLeft,
					right: gutterRight
				},
				availableArea: {
					availW,
					availH
				},
				envelopeBBoxWorld: {
					minX, maxX, minY, maxY,
					worldW, worldH
				},
				scaling: {
					scaleX: canvasState.scaleX,
					scaleY: canvasState.scaleY
				},
				alignment: {
					hAlign: settings.hAlign,
					vAlign: settings.vAlign
				},
				offset: {
					x: canvasState.offset.x,
					y: canvasState.offset.y
				},
				slack: {
					slackXpx: Math.max(0, availW - (maxX - minX) * canvasState.scaleX),
					slackYpx: Math.max(0, availH - (maxY - minY) * canvasState.scaleY)
				}
			});		
*/
		}	

	   /*
		* getWorldViewport()
		* Scopo:
		*   Restituire il rettangolo visibile in coordinate mondo.
		* Dettagli:
		*   - Converte gli angoli del canvas da CSS px a mondo con canvasToWorld().
	    */		
		function getWorldViewport() {
			// --- coordinate canvas degli angoli ---
			const { w, h } = cssCanvasSize();
			const topLeft     = canvasToWorld(0, 0);
			const bottomRight = canvasToWorld(w, h);			
			return {
				minX: Math.min(topLeft.x, bottomRight.x),
				maxX: Math.max(topLeft.x, bottomRight.x),
				minY: Math.min(topLeft.y, bottomRight.y),
				maxY: Math.max(topLeft.y, bottomRight.y),
			};
		}

	   /*
		* drawGridFixedWorldStep(step)
		* Scopo:
		*   Disegnare una griglia con passo costante in unità mondo, indipendente dallo zoom.
		* Dettagli:
		*   - Calcola le prime tacche visibili (multipli di step).
		*   - Limita il numero di linee per performance.
		*   - Chiama drawGridLabels() per le etichette.
	    */
		function drawGridFixedWorldStep(step = 1) {
			const { minX, maxX, minY, maxY } = getWorldViewport();

			// --- limitiamo il numero di linee per performance ---
			const maxLines = 1000;
			const nx = Math.ceil((maxX - minX) / step);
			const ny = Math.ceil((maxY - minY) / step);
			if (nx + ny > maxLines) {
				// aumenta il passo per non saturare
				step *= Math.ceil((nx + ny) / maxLines);
			}

			// --- arrotonda i punti di partenza al multiplo di 'step' ---
			const startX = Math.ceil(minX / step) * step;
			const startY = Math.ceil(minY / step) * step;

			ctx.save();
			ctx.lineWidth = 1;
			ctx.strokeStyle = settings.gridColor || "#e5e5e5";
			ctx.globalAlpha = 0.7;

			// --- linee verticali ---
			ctx.beginPath();
			for (let x = startX; x <= maxX; x += step) {
				const p1 = worldToCanvas(x, minY);
				const p2 = worldToCanvas(x, maxY);
				ctx.moveTo(Math.round(p1.x) + 0.5, Math.round(p1.y)); // pixel hint
				ctx.lineTo(Math.round(p2.x) + 0.5, Math.round(p2.y));
			}
			ctx.stroke();

			// --- linee orizzontali ---
			ctx.beginPath();
			for (let y = startY; y <= maxY; y += step) {
				const p1 = worldToCanvas(minX, y);
				const p2 = worldToCanvas(maxX, y);
				ctx.moveTo(Math.round(p1.x), Math.round(p1.y) + 0.5);
				ctx.lineTo(Math.round(p2.x), Math.round(p2.y) + 0.5);
			}
			ctx.stroke();

			ctx.restore();

			// --- etichette sugli assi ---
			drawGridLabels(startX, maxX, startY, maxY, step);
		}

	   /*
		* drawGridLabels(startX, maxX, startY, maxY, step)
		* Scopo:
		*   Disegnare le etichette numeriche lungo gli assi in corrispondenza delle tacche.
		* Dettagli:
		*   - Calcola px per step e decide uno “skip” per ~50px tra etichette.
		*   - Evita prima/ultima etichetta per non sovrapporle ai bordi.
		*   - X in basso (center/bottom), Y a sinistra (left/middle).
	    */
		function drawGridLabels(startX, maxX, startY, maxY, step) {
            // --- ogni quanti pixel disegnare una label ---
			const pxPerStepX = step * canvasState.scaleX;
			const pxPerStepY = step * canvasState.scaleY;
			const labelSkipX = Math.max(1, Math.floor(50 / pxPerStepX)); // ~1 label ogni 50px
			const labelSkipY = Math.max(1, Math.floor(50 / pxPerStepY));					
			
			// --- quante tacche cadono nell'intervallo inclusivo ---
			const countX = Math.floor((maxX - startX) / step) + 1;
			const countY = Math.floor((maxY - startY) / step) + 1;

			const pad = 2;
			const fmt = (v) => (step >= 1 ? v.toFixed(0) : v.toFixed(2));

			// --- euristica per non affollare (etichetta ogni 'skip' tacche) ---
			const skipX = Math.max(1, Math.floor(countX / 20)); // ~max 20 label
			const skipY = Math.max(1, Math.floor(countY / 20));

			ctx.save();
			ctx.font = settings.gridLabelFont;
			ctx.fillStyle = settings.gridLabelColor || "#6B6B6B";

			// --- X in basso ---
			ctx.textAlign = "center";
			ctx.textBaseline = "bottom";
			const { h: CH } = cssCanvasSize();
			const yBottom = CH - pad;
 
			for (let i = 0; i < countX; i++) {
				if (i % labelSkipX !== 0) continue;    			// salta etichette intermedie
				if (i === 0 || i === countX - 1) continue;      // salta prima/ultima
				if (i % skipX !== 0) continue;                  // anti-clutter

				const xWorld = startX + i * step;
				const p = worldToCanvas(xWorld, 0);
				ctx.fillText(fmt(xWorld), p.x, yBottom);
			}

			// --- Y a sinistra ---
			ctx.textAlign = "left";
			ctx.textBaseline = "middle";
			const xLeft = pad;

			for (let j = 0; j < countY; j++) {
				if (j % labelSkipY !== 0) continue;    			// salta etichette intermedie
				if (j === 0 || j === countY - 1) continue;      // salta prima/ultima
				if (j % skipY !== 0) continue;                  // anti-clutter

				const yWorld = startY + j * step;
				const p = worldToCanvas(0, yWorld);
				ctx.fillText(fmt(yWorld), xLeft, p.y);
			}

			ctx.restore();
		}

	   /*
		* drawAxisTitles()
		* Scopo:
		*   Disegnare i titoli degli assi (con eventuale unità) fuori dalle label di griglia.
		* Dettagli:
		*   - X: centrato sotto le etichette (baseline top).
		*   - Y: ruotato e centrato verticalmente a sinistra delle etichette.
	    */		
		function drawAxisTitles() {
			// --- TODO ---
			// --- impostare titolo e unità assi dentro HTML container ---
			if (envelopeId == 1) {
				settings.xTitle = "Ambient air temperature";
				settings.xUnit = "°C";
				settings.yTitle = "Outlet water temperature";
				settings.yUnit = "°C";	
			} else {
				settings.xTitle = "Evaporating pressure";
				settings.xUnit = "barg";
				settings.yTitle = "Condensing pressure";
				settings.yUnit = "barg";					
			}		
			
			const hasX = settings.xTitle || settings.xUnit;
			const hasY = settings.yTitle || settings.yUnit;
			if (!hasX && !hasY) return;

			ctx.save();
			ctx.font = settings.axisTitleFont;
			ctx.fillStyle = settings.axisTitleColor;

			const fontSize = parseInt(settings.axisTitleFont.match(/\d+/), 10) || 13;
			const pad = 4; // spazio extra oltre le label

			// --- Titolo X (sotto le label griglia) ---
			if (hasX) {
				const titleX = `${settings.xTitle}${settings.xUnit ? " [" + settings.xUnit + "]" : ""}`;
				ctx.textAlign = "center";
				ctx.textBaseline = "top";
				const { w: CW, h: CH } = cssCanvasSize();
				const yTitle = CH - 30 - 4;
				ctx.fillText(titleX, CW / 2, yTitle);
			}

			// --- Titolo Y (a sinistra delle label griglia) ---
			if (hasY) {
				const titleY = `${settings.yTitle}${settings.yUnit ? " [" + settings.yUnit + "]" : ""}`;
				ctx.save();
				const { h: CH } = cssCanvasSize();
				ctx.translate(0, CH / 2);
				ctx.rotate(-Math.PI / 2);
				ctx.textAlign = "center";
				ctx.textBaseline = "top";
				const xTitle = 30; // 30px outer gutter: titolo “tutto a sinistra”
				ctx.fillText(titleY, 0, xTitle);
				ctx.restore();
			}

			ctx.restore();
		}

	   /*
		* init()
		* Scopo:
		*   Entry point per una singola istanza: crea canvas, legge input, collega observer,
		*   invoca resize+fit+draw per mostrare il primo frame.
	    */		
        function init() {
            createCanvas();
            findInputs();
            setupInputsObserver();
            resizeCanvas(); 
        }

        init();
    }

   /*
	* initializeAllEnvelopes()
	* Scopo:
	*   Individuare tutti i container con data-env-graph-id e creare un’envelope
	*   per ciascuno, legando l’input container corrispondente.
	* Dettagli:
	*   - Permette più grafici indipendenti nella stessa pagina.
    */
    function initializeAllEnvelopes() {
        const graphContainers = document.querySelectorAll('[data-env-graph-id]');
        graphContainers.forEach(graphContainer => {
            const envelopeId = graphContainer.getAttribute('data-env-graph-id');
            const inputContainer = document.querySelector(`[data-env-value-id="${envelopeId}"]`);
            if (inputContainer) {
                createEnvelope(graphContainer, inputContainer, envelopeId);
            }
        });
    }

   /*
	* DOMContentLoaded bootstrap
	* Scopo:
	*   Eseguire initializeAllEnvelopes() quando il DOM è pronto (o subito se già pronto).
    */
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeAllEnvelopes);
    } else {
        initializeAllEnvelopes();
    }
})();
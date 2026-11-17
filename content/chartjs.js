/* Docsify integration for interactive Chart.js blocks. */
(function () {
    const allowedTypes = new Set(["line", "bar", "scatter"]);
    const charts = new Set();
    const cultureLabels = {
        id: "wiki-culture-note-labels",
        afterDatasetsDraw(chart) {
            if (!chart.config.options.plugins.cultureLabels?.display) return;
            const context = chart.ctx;
            const categoryLabels = chart.config.options.plugins.cultureLabels.categories || [];
            context.save();
            context.font = "12px sans-serif";
            context.textAlign = "center";
            context.fillStyle = "#ffffff";
            categoryLabels.forEach((label, index) => {
                const y = chart.scales.y.getPixelForValue(index);
                const dataset = chart.data.datasets[chart.data.datasets.length - index - 1];
                context.textAlign = "right";
                context.textBaseline = "middle";
                context.fillStyle = dataset?.pointBackgroundColor || "#ffffff";
                context.fillText(label, chart.chartArea.left - 12, y);
            });
            context.textAlign = "center";
            context.textBaseline = "alphabetic";
            context.fillStyle = "#ffffff";
            chart.data.datasets.forEach((dataset, datasetIndex) => {
                const meta = chart.getDatasetMeta(datasetIndex);
                meta.data.forEach((point, index) => {
                    const note = dataset.data[index]?.note;
                    if (note) context.fillText(note, point.x, point.y - 20);
                });
            });
            context.restore();
        },
    };
    const cultureGuides = {
        id: "wiki-culture-point-guides",
        beforeDatasetsDraw(chart) {
            if (!chart.config.options.plugins.cultureLabels?.display) return;
            const { ctx, chartArea, scales } = chart;
            const xValues = new Set();
            const yValues = new Set();
            chart.data.datasets.forEach((dataset) => {
                dataset.data.forEach((point) => {
                    xValues.add(point.x);
                    yValues.add(point.y);
                });
            });
            ctx.save();
            ctx.strokeStyle = "rgba(160, 160, 180, 0.22)";
            ctx.lineWidth = 1;
            ctx.setLineDash([3, 4]);
            xValues.forEach((value) => {
                const x = scales.x.getPixelForValue(value);
                ctx.beginPath();
                ctx.moveTo(x, chartArea.top);
                ctx.lineTo(x, chartArea.bottom);
                ctx.stroke();
            });
            yValues.forEach((value) => {
                const y = scales.y.getPixelForValue(value);
                ctx.beginPath();
                ctx.moveTo(chartArea.left, y);
                ctx.lineTo(chartArea.right, y);
                ctx.stroke();
            });
            ctx.restore();
        },
    };

    function destroyCharts() {
        charts.forEach((chart) => chart.destroy());
        charts.clear();
    }

    function renderCharts() {
        const root = document.querySelector("#main .markdown-section") || document.querySelector(".markdown-section");
        if (!root || !window.Chart) return;

        root.querySelectorAll("pre > code.lang-chartjs, pre > code.language-chartjs").forEach((code) => {
            const pre = code.parentElement;
            if (!pre || pre.dataset.chartRendered === "true") return;
            pre.dataset.chartRendered = "true";

            const wrapper = document.createElement("figure");
            wrapper.className = "wiki-chart";
            const canvas = document.createElement("canvas");
            canvas.setAttribute("role", "img");
            canvas.setAttribute("aria-label", "Gráfico interativo");
            wrapper.appendChild(canvas);

            try {
                const config = JSON.parse(code.textContent);
                if (!config || !allowedTypes.has(config.type) || !config.data || !Array.isArray(config.data.datasets)) {
                    throw new Error("Use os tipos line, bar ou scatter e informe data.datasets.");
                }

                const textColor = "#ffffff";
                const gridColor = getComputedStyle(document.body).getPropertyValue("--border").trim() || "rgba(160, 160, 180, .25)";
                const baseOptions = {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { labels: { color: textColor } },
                        title: { color: textColor },
                    },
                    scales: config.type === "scatter" ? {
                        x: { type: "linear", position: "bottom", ticks: { color: textColor }, grid: { color: gridColor } },
                        y: { ticks: { color: textColor }, grid: { color: gridColor } },
                    } : {
                        x: { ticks: { color: textColor }, grid: { color: gridColor } },
                        y: { ticks: { color: textColor }, grid: { color: gridColor } },
                    },
                };
                const options = Object.assign({}, baseOptions, config.options || {});
                options.plugins = Object.assign({}, baseOptions.plugins, config.options?.plugins || {});
                options.plugins.legend = Object.assign({}, baseOptions.plugins.legend, config.options?.plugins?.legend || {});
                options.plugins.title = Object.assign({}, baseOptions.plugins.title, config.options?.plugins?.title || {});
                if (config.options?.plugins?.cultureLabels?.display) {
                    options.plugins.tooltip = Object.assign({}, config.options.plugins.tooltip || {});
                    options.plugins.tooltip.callbacks = Object.assign({}, config.options.plugins.tooltip?.callbacks || {}, {
                        label: (context) => `${context.raw.note || "Nota"}: ${context.raw.x} cents`,
                    });
                }
                if (config.options?.scales) {
                    options.scales = Object.assign({}, baseOptions.scales, config.options.scales);
                    ["x", "y"].forEach((axis) => {
                        if (config.options.scales[axis]) {
                            options.scales[axis] = Object.assign({}, baseOptions.scales[axis], config.options.scales[axis]);
                            options.scales[axis].ticks = Object.assign({}, baseOptions.scales[axis]?.ticks || {}, config.options.scales[axis].ticks || {});
                            options.scales[axis].grid = Object.assign({}, baseOptions.scales[axis]?.grid || {}, config.options.scales[axis].grid || {});
                        }
                    });
                }
                const categoryLabels = config.options?.scales?.y?.ticks?.labels;
                if (categoryLabels && options.scales.y?.ticks) {
                    options.scales.y.ticks.callback = (value) => categoryLabels[value] || "";
                    delete options.scales.y.ticks.labels;
                }

                const chartConfig = Object.assign({}, config, { options });
                if (config.options?.plugins?.cultureLabels) chartConfig.plugins = [cultureGuides, cultureLabels];
                delete chartConfig.cultureLabels;
                const chart = new Chart(canvas.getContext("2d"), chartConfig);
                charts.add(chart);
                pre.replaceWith(wrapper);
            } catch (error) {
                wrapper.classList.add("wiki-chart-error");
                wrapper.textContent = "Não foi possível renderizar este gráfico. Confira o JSON e o tipo informado.";
                pre.replaceWith(wrapper);
                console.warn("Docsify Chart.js:", error);
            }
        });
    }

    window.docsifyChartPlugin = function (hook) {
        hook.beforeEach(destroyCharts);
        hook.doneEach(renderCharts);
    };
})();

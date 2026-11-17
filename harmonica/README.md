# 🎺 Harmonica

- [🎺 Gaitas](harmonica/gaita/README)
- [🎺 Tablatura](harmonica/tablatura/README)

## **🎶 Tonalidade**

| **Altura** | **Grave**     | **→**  | **→** | **→**  | **→** | **→** | **→**  | **→** | **→**  | **→** | **→** | **Aguda**     |
| ---------- | ------------- | ------ | ----- | ------ | ----- | ----- | ------ | ----- | ------ | ----- | ----- | ------------- |
| **Tom**    | Sol           | Lá♭    | Lá    | Si♭    | Si    | Dó    | Ré♭     | Ré    | Mi♭    | Mi    | Fá    | Fá♯           |
| **Cifra**  | G             | Ab     | A     | Bb     | B     | C     | Db      | D     | Eb     | E     | F     | F#            |
| **Frequência** | 392 Hz | 415 Hz | 440 Hz | 466 Hz | 494 Hz | 523 Hz | 554 Hz | 587 Hz | 622 Hz | 659 Hz | 698 Hz | 740 Hz |

### Comparação de escalas musicais

Cada linha representa uma escala tradicional; os pontos mostram as notas em cents dentro da oitava. A comparação é aproximada: algumas tradições usam afinações e alturas que não coincidem exatamente com o sistema temperado ocidental.

```chartjs
{
  "type": "scatter",
  "options": {
    "responsive": true,
    "maintainAspectRatio": false,
    "layout": { "padding": { "left": 120, "top": 28 } },
    "plugins": {
      "title": {
        "display": true,
        "text": "Notas em escalas de diferentes tradições",
        "font": { "size": 18, "weight": "bold" },
        "padding": { "top": 8, "bottom": 22 }
      },
      "legend": {
        "display": false
      },
      "cultureLabels": {
        "display": true,
        "categories": [
          "Mundo árabe",
          "Índia",
          "Japão",
          "China",
          "Ocidente"
        ]
      }
    },
    "scales": {
      "x": {
        "type": "linear",
        "suggestedMin": 0,
        "suggestedMax": 1200,
        "grace": 45,
        "ticks": { "stepSize": 100, "autoSkip": false },
        "grid": { "color": "rgba(160, 160, 180, 0.2)" }
      },
      "y": {
        "type": "linear",
        "min": -0.2,
        "max": 4.2,
        "reverse": true,
        "ticks": {
          "stepSize": 1,
          "display": false
        },
        "grid": { "display": false }
      }
    }
  },
  "data": {
    "datasets": [
      {
        "label": "Ocidente — escala maior",
        "data": [{"x":0,"y":4,"note":"Dó"},{"x":200,"y":4,"note":"Ré"},{"x":400,"y":4,"note":"Mi"},{"x":500,"y":4,"note":"Fá"},{"x":700,"y":4,"note":"Sol"},{"x":900,"y":4,"note":"Lá"},{"x":1100,"y":4,"note":"Si"},{"x":1200,"y":4,"note":"Dó"}],
        "showLine": false,
        "pointRadius": 6,
        "pointBackgroundColor": "#4388f5"
      },
      {
        "label": "China — Gong (pentatônica)",
        "data": [{"x":0,"y":3,"note":"Dó"},{"x":200,"y":3,"note":"Ré"},{"x":400,"y":3,"note":"Mi"},{"x":700,"y":3,"note":"Sol"},{"x":900,"y":3,"note":"Lá"},{"x":1200,"y":3,"note":"Dó"}],
        "showLine": false,
        "pointRadius": 6,
        "pointBackgroundColor": "#e4a72e"
      },
      {
        "label": "Japão — In (miyako-bushi)",
        "data": [{"x":0,"y":2,"note":"Dó"},{"x":100,"y":2,"note":"Ré♭"},{"x":500,"y":2,"note":"Fá"},{"x":700,"y":2,"note":"Sol"},{"x":800,"y":2,"note":"Lá♭"},{"x":1200,"y":2,"note":"Dó"}],
        "showLine": false,
        "pointRadius": 6,
        "pointBackgroundColor": "#d85d92"
      },
      {
        "label": "Índia — Raga Bhairav",
        "data": [{"x":0,"y":1,"note":"Dó"},{"x":100,"y":1,"note":"Ré♭"},{"x":400,"y":1,"note":"Mi"},{"x":500,"y":1,"note":"Fá"},{"x":700,"y":1,"note":"Sol"},{"x":800,"y":1,"note":"Lá♭"},{"x":1100,"y":1,"note":"Si"},{"x":1200,"y":1,"note":"Dó"}],
        "showLine": false,
        "pointRadius": 6,
        "pointBackgroundColor": "#24a88e"
      },
      {
        "label": "Mundo árabe — Maqam Rast (aprox.)",
        "data": [{"x":0,"y":0,"note":"Dó"},{"x":200,"y":0,"note":"Ré"},{"x":350,"y":0,"note":"Mi meio bemol"},{"x":500,"y":0,"note":"Fá"},{"x":700,"y":0,"note":"Sol"},{"x":900,"y":0,"note":"Lá"},{"x":1050,"y":0,"note":"Si bemol"},{"x":1200,"y":0,"note":"Dó"}],
        "showLine": false,
        "pointRadius": 6,
        "pointBackgroundColor": "#9863d4"
      }
    ]
  }
}
```

> **Escala maior de Dó:** a linha ocidental mostra as notas Dó, Ré, Mi, Fá, Sol, Lá e Si. Como essa escala não tem sustenidos nem bemóis, as teclas pretas não aparecem.

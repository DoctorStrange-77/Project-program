/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Client, WorkoutPlan, WorkoutTemplate } from '../types';

export const DEMO_CLIENTS: Client[] = [
  {
    id: 'c1',
    nome: 'Mario',
    cognome: 'Rossi',
    eta: 35,
    sesso: 'Uomo',
    altezza: 180,
    pesoAttuale: 82,
    obiettivo: 'Ipertrofia',
    livelloEsperienza: 'Intermedio',
    allenamentiSettimanali: 4,
    dataInizio: '2026-06-01',
    limitazioniFisiche: 'Nessun infortunio recente. Leggero fastidio alla cuffia dei rotatori destra se fa panca piana pesante con bilanciere (preferisce i manubri o chest press convergente).',
    noteCoach: 'Mario è molto costante. Risponde bene ad alti volumi sui gruppi muscolari di trazione (dorso). Focus su incremento massa muscolare su pettorali e dorso.',
    rilevazioni: [
      {
        id: 'r1_1',
        data: '2026-06-01',
        peso: 84.5,
        vita: 92,
        torace: 104,
        braccio: 38.0,
        coscia: 58.0,
        massaGrassa: 16.5,
        noteControllo: 'Inizio percorso. Impostata dieta ipercalorica controllata.'
      },
      {
        id: 'r1_2',
        data: '2026-06-15',
        peso: 83.8,
        vita: 90.5,
        torace: 104,
        braccio: 38.2,
        coscia: 58.0,
        massaGrassa: 15.8,
        noteControllo: 'Ottimo ricomposizione corporea iniziale. Vita scesa e mantenuto il volume su braccia.'
      },
      {
        id: 'r1_3',
        data: '2026-07-01',
        peso: 82.7,
        vita: 89.0,
        torace: 104.5,
        braccio: 38.5,
        coscia: 58.3,
        massaGrassa: 15.0,
        noteControllo: 'Ottima aderenza. Forza in aumento sui multiarticolari fondamentali.'
      },
      {
        id: 'r1_4',
        data: '2026-07-13',
        peso: 82.0,
        vita: 88.0,
        torace: 105.0,
        braccio: 38.8,
        coscia: 58.5,
        massaGrassa: 14.3,
        noteControllo: 'Peso stabile ma linee nettamente migliorate. Aumentiamo leggermente i carboidrati pre-allenamento.'
      }
    ]
  },
  {
    id: 'c2',
    nome: 'Luca',
    cognome: 'Bianchi',
    eta: 42,
    sesso: 'Uomo',
    altezza: 175,
    pesoAttuale: 89,
    obiettivo: 'Dimagrimento',
    livelloEsperienza: 'Principiante',
    allenamentiSettimanali: 3,
    dataInizio: '2026-06-10',
    limitazioniFisiche: 'Leggero fastidio al ginocchio sinistro durante accosciate profonde. Evitare squat con bilanciere pesante per ora.',
    noteCoach: 'Preferisce macchinari per ora per imparare i pattern motori base. Ottima motivazione.',
    rilevazioni: [
      {
        id: 'r2_1',
        data: '2026-06-10',
        peso: 91.5,
        vita: 102,
        torace: 110,
        braccio: 39.0,
        coscia: 62.0,
        massaGrassa: 24.0,
        noteControllo: 'Inizio percorso. Focus su deficit calorico moderato e camminate quotidiane.'
      },
      {
        id: 'r2_2',
        data: '2026-06-25',
        peso: 90.1,
        vita: 100.5,
        torace: 109,
        braccio: 38.8,
        coscia: 61.5,
        massaGrassa: 23.2,
        noteControllo: 'Dimagrimento costante. Fastidio al ginocchio in riduzione grazie al lavoro guidato sulla leg press.'
      },
      {
        id: 'r2_3',
        data: '2026-07-10',
        peso: 89.0,
        vita: 99.0,
        torace: 108.5,
        braccio: 38.7,
        coscia: 61.0,
        massaGrassa: 22.5,
        noteControllo: 'Grande costanza. Inserito cardio LISS post allenamento per 20 minuti.'
      }
    ]
  },
  {
    id: 'c3',
    nome: 'Giulia',
    cognome: 'Romano',
    eta: 30,
    sesso: 'Donna',
    altezza: 168,
    pesoAttuale: 58.5,
    obiettivo: 'Sviluppo glutei',
    livelloEsperienza: 'Intermedio',
    allenamentiSettimanali: 4,
    dataInizio: '2026-06-15',
    limitazioniFisiche: 'Nessuna limitazione. Ottima mobilità d\'anca.',
    noteCoach: 'Flessibilità discreta. Ottima attivazione dei glutei, focus su carichi progressivi su hip thrust e stacchi rumeni.',
    rilevazioni: [
      {
        id: 'r3_1',
        data: '2026-06-15',
        peso: 59.2,
        vita: 68,
        torace: 88,
        braccio: 26.5,
        coscia: 54.0,
        massaGrassa: 20.5,
        noteControllo: 'Inizio percorso. Ottimo focus su attivazione neuromuscolare.'
      },
      {
        id: 'r3_2',
        data: '2026-07-01',
        peso: 58.8,
        vita: 67.2,
        torace: 88,
        braccio: 26.3,
        coscia: 54.5,
        massaGrassa: 19.8,
        noteControllo: 'Massa grassa in riduzione, glutei e cosce acquistano tono.'
      },
      {
        id: 'r3_3',
        data: '2026-07-13',
        peso: 58.5,
        vita: 66.5,
        torace: 87.5,
        braccio: 26.5,
        coscia: 54.8,
        massaGrassa: 19.2,
        noteControllo: 'Composizione corporea eccellente. Peso stabile ma volumi glutei aumentati.'
      }
    ]
  }
];

export const DEMO_WORKOUT_PLANS: WorkoutPlan[] = [
  {
    id: 'p1',
    nome: 'Ipertrofia 4 giorni',
    clienteId: 'c1',
    clienteNomeCompleto: 'Mario Rossi',
    obiettivo: 'Ipertrofia',
    allenamentiSettimanali: 4,
    durataSettimane: 4,
    dataInizio: '2026-07-15',
    noteGenerali: 'Progressione del carico ogni settimana di circa il 2.5% sui multiarticolari fondamentali. Mantenere l\'intensità (RIR 1-2).',
    dataCreazione: '2026-07-13',
    status: 'Attiva',
    giornate: [
      {
        id: 'd1',
        nome: 'A: Push',
        esercizi: [
          {
            id: 'we1',
            exerciseId: 'e1',
            nome: 'Chest Press convergente',
            distrettoMuscolare: 'Pettorali',
            serie: 3,
            repMin: 8,
            repMax: 12,
            rir: 2,
            recupero: 120,
            tut: '3-0-1-0',
            noteTecniche: 'Schiaccia le scapole contro lo schienale. Contrazione di picco di 1 secondo.',
            tecnicaIntensita: 'Top set',
            caricoPrevisto: '60kg'
          },
          {
            id: 'we2',
            exerciseId: 'e2',
            nome: 'Distensioni con manubri su panca inclinata',
            distrettoMuscolare: 'Pettorali',
            serie: 3,
            repMin: 8,
            repMax: 12,
            rir: 2,
            recupero: 120,
            tut: '3-0-1-0',
            noteTecniche: 'Panca inclinata a 30 gradi. Massimo allungamento in basso senza forzare le spalle.',
            tecnicaIntensita: 'Nessuna',
            caricoPrevisto: '24kg+24kg'
          },
          {
            id: 'we3',
            exerciseId: 'e10',
            nome: 'Shoulder Press',
            distrettoMuscolare: 'Spalle',
            serie: 3,
            repMin: 8,
            repMax: 12,
            rir: 2,
            recupero: 120,
            tut: '3-0-1-0',
            noteTecniche: 'Gomiti leggermente proiettati in avanti rispetto al piano scapolare.',
            tecnicaIntensita: 'Nessuna',
            caricoPrevisto: '35kg'
          },
          {
            id: 'we4',
            exerciseId: 'e18',
            nome: 'Push Down al cavo',
            distrettoMuscolare: 'Tricipiti',
            serie: 3,
            repMin: 10,
            repMax: 12,
            rir: 2,
            recupero: 90,
            tut: '3-0-1-0',
            noteTecniche: 'Mantieni i gomiti stretti lungo i fianchi. Usa una barra dritta o la corda.',
            tecnicaIntensita: 'Drop set',
            caricoPrevisto: '20kg'
          }
        ]
      },
      {
        id: 'd2',
        nome: 'B: Pull',
        esercizi: [
          {
            id: 'we5',
            exerciseId: 'e5',
            nome: 'Lat Machine presa prona',
            distrettoMuscolare: 'Dorso',
            serie: 3,
            repMin: 8,
            repMax: 12,
            rir: 2,
            recupero: 120,
            tut: '3-0-1-0',
            noteTecniche: 'Sbarra al petto, concentrati sul deprimere le spalle prima di flettere i gomiti.',
            tecnicaIntensita: 'Nessuna',
            caricoPrevisto: '55kg'
          },
          {
            id: 'we6',
            exerciseId: 'e7',
            nome: 'Pulley basso',
            distrettoMuscolare: 'Dorso',
            serie: 3,
            repMin: 8,
            repMax: 12,
            rir: 2,
            recupero: 120,
            tut: '3-0-1-0',
            noteTecniche: 'Spalle rilassate in allungamento, petto in fuori in contrazione.',
            tecnicaIntensita: 'Nessuna',
            caricoPrevisto: '45kg'
          },
          {
            id: 'we7',
            exerciseId: 'e13',
            nome: 'Reverse Pec Deck',
            distrettoMuscolare: 'Spalle',
            serie: 3,
            repMin: 12,
            repMax: 15,
            rir: 1,
            recupero: 90,
            tut: '2-0-1-0',
            noteTecniche: 'Non tirare con le braccia, spingi indietro i gomiti stringendo i deltoidi posteriori.',
            tecnicaIntensita: 'Nessuna',
            caricoPrevisto: '30kg'
          },
          {
            id: 'we8',
            exerciseId: 'e15',
            nome: 'Curl con bilanciere EZ',
            distrettoMuscolare: 'Bicipiti',
            serie: 3,
            repMin: 8,
            repMax: 12,
            rir: 2,
            recupero: 90,
            tut: '3-0-1-0',
            noteTecniche: 'Evita il cheating con la schiena. Gomiti fermi lungo i fianchi.',
            tecnicaIntensita: 'Nessuna',
            caricoPrevisto: '25kg'
          }
        ]
      },
      {
        id: 'd3',
        nome: 'C: Legs',
        esercizi: [
          {
            id: 'we9',
            exerciseId: 'e20',
            nome: 'Squat',
            distrettoMuscolare: 'Quadricipiti',
            serie: 4,
            repMin: 6,
            repMax: 8,
            rir: 2,
            recupero: 180,
            tut: '3-1-1-0',
            noteTecniche: 'Pausa di 1 secondo in basso per disattivare il riflesso miotatico.',
            tecnicaIntensita: 'Nessuna',
            caricoPrevisto: '80kg'
          },
          {
            id: 'we10',
            exerciseId: 'e21',
            nome: 'Leg Press',
            distrettoMuscolare: 'Quadricipiti',
            serie: 3,
            repMin: 10,
            repMax: 12,
            rir: 1,
            recupero: 120,
            tut: '3-0-1-0',
            noteTecniche: 'Piedi a larghezza spalle. Non staccare mai il bacino dallo schienale.',
            tecnicaIntensita: 'Back-off',
            caricoPrevisto: '120kg'
          },
          {
            id: 'we11',
            exerciseId: 'e24',
            nome: 'Stacco rumeno',
            distrettoMuscolare: 'Femorali',
            serie: 3,
            repMin: 8,
            repMax: 10,
            rir: 2,
            recupero: 120,
            tut: '3-0-1-0',
            noteTecniche: 'Busto dritto, spingi indietro il bacino sentendo allungare i femorali.',
            tecnicaIntensita: 'Nessuna',
            caricoPrevisto: '70kg'
          },
          {
            id: 'we12',
            exerciseId: 'e29',
            nome: 'Calf Raise',
            distrettoMuscolare: 'Polpacci',
            serie: 4,
            repMin: 12,
            repMax: 15,
            rir: 1,
            recupero: 60,
            tut: '2-2-1-1',
            noteTecniche: 'Massimo allungamento (2s) e massima contrazione di picco (1s).',
            tecnicaIntensita: 'Nessuna',
            caricoPrevisto: '40kg'
          }
        ]
      },
      {
        id: 'd4',
        nome: 'D: Upper Body',
        esercizi: [
          {
            id: 'we13',
            exerciseId: 'e2',
            nome: 'Distensioni con manubri su panca inclinata',
            distrettoMuscolare: 'Pettorali',
            serie: 3,
            repMin: 8,
            repMax: 12,
            rir: 2,
            recupero: 120,
            tut: '3-0-1-0',
            noteTecniche: 'Inclinazione a 15-30 gradi, controlla bene la discesa.',
            tecnicaIntensita: 'Nessuna',
            caricoPrevisto: '22kg+22kg'
          },
          {
            id: 'we14',
            exerciseId: 'e6',
            nome: 'Lat Machine presa neutra',
            distrettoMuscolare: 'Dorso',
            serie: 3,
            repMin: 8,
            repMax: 12,
            rir: 2,
            recupero: 120,
            tut: '3-0-1-0',
            noteTecniche: 'Presa a larghezza spalle, tira portando indietro e in basso le spalle.',
            tecnicaIntensita: 'Nessuna',
            caricoPrevisto: '50kg'
          },
          {
            id: 'we15',
            exerciseId: 'e11',
            nome: 'Alzate laterali con manubri',
            distrettoMuscolare: 'Spalle',
            serie: 4,
            repMin: 12,
            repMax: 15,
            rir: 1,
            recupero: 90,
            tut: '2-0-1-0',
            noteTecniche: 'Inclinati leggermente in avanti, spingi i manubri verso l\'esterno, non in alto.',
            tecnicaIntensita: 'Myo-reps',
            caricoPrevisto: '10kg+10kg'
          },
          {
            id: 'we16',
            exerciseId: 'e19',
            nome: 'French Press con bilanciere EZ',
            distrettoMuscolare: 'Tricipiti',
            serie: 3,
            repMin: 8,
            repMax: 12,
            rir: 2,
            recupero: 90,
            tut: '3-0-1-0',
            noteTecniche: 'Abbassa il bilanciere verso la fronte o leggermente sopra la testa.',
            tecnicaIntensita: 'Nessuna',
            caricoPrevisto: '20kg'
          }
        ]
      }
    ],
    weeks: [
      {
        weekIndex: 1,
        giornate: [
          {
            id: 'd1_w1',
            nome: 'A: Push',
            esercizi: [
              { id: 'we1_w1', exerciseId: 'e1', nome: 'Chest Press convergente', distrettoMuscolare: 'Pettorali', serie: 3, repMin: 8, repMax: 12, rir: 2, recupero: 120, tut: '3-0-1-0', noteTecniche: 'Schiaccia le scapole contro lo schienale.', tecnicaIntensita: 'Top set', caricoPrevisto: '60kg' },
              { id: 'we2_w1', exerciseId: 'e2', nome: 'Distensioni con manubri su panca inclinata', distrettoMuscolare: 'Pettorali', serie: 3, repMin: 8, repMax: 12, rir: 2, recupero: 120, tut: '3-0-1-0', noteTecniche: 'Panca inclinata a 30 gradi.', tecnicaIntensita: 'Nessuna', caricoPrevisto: '24kg+24kg' },
              { id: 'we3_w1', exerciseId: 'e10', nome: 'Shoulder Press', distrettoMuscolare: 'Spalle', serie: 3, repMin: 8, repMax: 12, rir: 2, recupero: 120, tut: '3-0-1-0', noteTecniche: 'Gomiti leggermente in avanti.', tecnicaIntensita: 'Nessuna', caricoPrevisto: '35kg' },
              { id: 'we4_w1', exerciseId: 'e18', nome: 'Push Down al cavo', distrettoMuscolare: 'Tricipiti', serie: 3, repMin: 10, repMax: 12, rir: 2, recupero: 90, tut: '3-0-1-0', noteTecniche: 'Usa barra dritta.', tecnicaIntensita: 'Drop set', caricoPrevisto: '20kg' }
            ]
          },
          {
            id: 'd2_w1',
            nome: 'B: Pull',
            esercizi: [
              { id: 'we5_w1', exerciseId: 'e5', nome: 'Lat Machine presa prona', distrettoMuscolare: 'Dorso', serie: 3, repMin: 8, repMax: 12, rir: 2, recupero: 120, tut: '3-0-1-0', noteTecniche: 'Sbarra al petto.', tecnicaIntensita: 'Nessuna', caricoPrevisto: '55kg' },
              { id: 'we6_w1', exerciseId: 'e7', nome: 'Pulley basso', distrettoMuscolare: 'Dorso', serie: 3, repMin: 8, repMax: 12, rir: 2, recupero: 120, tut: '3-0-1-0', noteTecniche: 'Spalle rilassate in allungamento.', tecnicaIntensita: 'Nessuna', caricoPrevisto: '45kg' },
              { id: 'we7_w1', exerciseId: 'e13', nome: 'Reverse Pec Deck', distrettoMuscolare: 'Spalle', serie: 3, repMin: 12, repMax: 15, rir: 1, recupero: 90, tut: '2-0-1-0', noteTecniche: 'Delt posteriore.', tecnicaIntensita: 'Nessuna', caricoPrevisto: '30kg' },
              { id: 'we8_w1', exerciseId: 'e15', nome: 'Curl con bilanciere EZ', distrettoMuscolare: 'Bicipiti', serie: 3, repMin: 8, repMax: 12, rir: 2, recupero: 90, tut: '3-0-1-0', noteTecniche: 'Gomiti fermi.', tecnicaIntensita: 'Nessuna', caricoPrevisto: '25kg' }
            ]
          },
          {
            id: 'd3_w1',
            nome: 'C: Legs',
            esercizi: [
              { id: 'we9_w1', exerciseId: 'e20', nome: 'Squat', distrettoMuscolare: 'Quadricipiti', serie: 4, repMin: 6, repMax: 8, rir: 2, recupero: 180, tut: '3-1-1-0', noteTecniche: 'Pausa in basso.', tecnicaIntensita: 'Nessuna', caricoPrevisto: '80kg' },
              { id: 'we10_w1', exerciseId: 'e21', nome: 'Leg Press', distrettoMuscolare: 'Quadricipiti', serie: 3, repMin: 10, repMax: 12, rir: 1, recupero: 120, tut: '3-0-1-0', noteTecniche: 'Non staccare il bacino.', tecnicaIntensita: 'Back-off', caricoPrevisto: '120kg' },
              { id: 'we11_w1', exerciseId: 'e24', nome: 'Stacco rumeno', distrettoMuscolare: 'Femorali', serie: 3, repMin: 8, repMax: 10, rir: 2, recupero: 120, tut: '3-0-1-0', noteTecniche: 'Spingi indietro bacino.', tecnicaIntensita: 'Nessuna', caricoPrevisto: '70kg' },
              { id: 'we12_w1', exerciseId: 'e29', nome: 'Calf Raise', distrettoMuscolare: 'Polpacci', serie: 4, repMin: 12, repMax: 15, rir: 1, recupero: 60, tut: '2-2-1-1', noteTecniche: 'Massimo allungamento.', tecnicaIntensita: 'Nessuna', caricoPrevisto: '40kg' }
            ]
          },
          {
            id: 'd4_w1',
            nome: 'D: Upper Body',
            esercizi: [
              { id: 'we13_w1', exerciseId: 'e2', nome: 'Distensioni con manubri su panca inclinata', distrettoMuscolare: 'Pettorali', serie: 3, repMin: 8, repMax: 12, rir: 2, recupero: 120, tut: '3-0-1-0', noteTecniche: 'Inclinazione 15-30 gradi.', tecnicaIntensita: 'Nessuna', caricoPrevisto: '22kg+22kg' },
              { id: 'we14_w1', exerciseId: 'e6', nome: 'Lat Machine presa neutra', distrettoMuscolare: 'Dorso', serie: 3, repMin: 8, repMax: 12, rir: 2, recupero: 120, tut: '3-0-1-0', noteTecniche: 'Presa larghezza spalle.', tecnicaIntensita: 'Nessuna', caricoPrevisto: '50kg' },
              { id: 'we15_w1', exerciseId: 'e11', nome: 'Alzate laterali con manubri', distrettoMuscolare: 'Spalle', serie: 4, repMin: 12, repMax: 15, rir: 1, recupero: 90, tut: '2-0-1-0', noteTecniche: 'Spingi manubri all\'infuori.', tecnicaIntensita: 'Myo-reps', caricoPrevisto: '10kg+10kg' },
              { id: 'we16_w1', exerciseId: 'e19', nome: 'French Press con bilanciere EZ', distrettoMuscolare: 'Tricipiti', serie: 3, repMin: 8, repMax: 12, rir: 2, recupero: 90, tut: '3-0-1-0', noteTecniche: 'Gomiti fermi.', tecnicaIntensita: 'Nessuna', caricoPrevisto: '20kg' }
            ]
          }
        ]
      },
      {
        weekIndex: 2,
        giornate: [
          {
            id: 'd1_w2',
            nome: 'A: Push',
            esercizi: [
              { id: 'we1_w2', exerciseId: 'e1', nome: 'Chest Press convergente', distrettoMuscolare: 'Pettorali', serie: 3, repMin: 8, repMax: 12, rir: 2, recupero: 120, tut: '3-0-1-0', noteTecniche: 'Schiaccia le scapole contro lo schienale.', tecnicaIntensita: 'Top set', caricoPrevisto: '62.5kg' },
              { id: 'we2_w2', exerciseId: 'e2', nome: 'Distensioni con manubri su panca inclinata', distrettoMuscolare: 'Pettorali', serie: 3, repMin: 8, repMax: 12, rir: 2, recupero: 120, tut: '3-0-1-0', noteTecniche: 'Panca inclinata a 30 gradi.', tecnicaIntensita: 'Nessuna', caricoPrevisto: '24kg+24kg' },
              { id: 'we3_w2', exerciseId: 'e10', nome: 'Shoulder Press', distrettoMuscolare: 'Spalle', serie: 3, repMin: 8, repMax: 12, rir: 2, recupero: 120, tut: '3-0-1-0', noteTecniche: 'Gomiti leggermente in avanti.', tecnicaIntensita: 'Nessuna', caricoPrevisto: '35kg' },
              { id: 'we4_w2', exerciseId: 'e18', nome: 'Push Down al cavo', distrettoMuscolare: 'Tricipiti', serie: 3, repMin: 10, repMax: 12, rir: 2, recupero: 90, tut: '3-0-1-0', noteTecniche: 'Usa barra dritta.', tecnicaIntensita: 'Drop set', caricoPrevisto: '22.5kg' }
            ]
          },
          {
            id: 'd2_w2',
            nome: 'B: Pull',
            esercizi: [
              { id: 'we5_w2', exerciseId: 'e5', nome: 'Lat Machine presa prona', distrettoMuscolare: 'Dorso', serie: 3, repMin: 8, repMax: 12, rir: 2, recupero: 120, tut: '3-0-1-0', noteTecniche: 'Sbarra al petto.', tecnicaIntensita: 'Nessuna', caricoPrevisto: '57.5kg' },
              { id: 'we6_w2', exerciseId: 'e7', nome: 'Pulley basso', distrettoMuscolare: 'Dorso', serie: 3, repMin: 8, repMax: 12, rir: 2, recupero: 120, tut: '3-0-1-0', noteTecniche: 'Spalle rilassate in allungamento.', tecnicaIntensita: 'Nessuna', caricoPrevisto: '47.5kg' },
              { id: 'we7_w2', exerciseId: 'e13', nome: 'Reverse Pec Deck', distrettoMuscolare: 'Spalle', serie: 3, repMin: 12, repMax: 15, rir: 1, recupero: 90, tut: '2-0-1-0', noteTecniche: 'Delt posteriore.', tecnicaIntensita: 'Nessuna', caricoPrevisto: '32.5kg' },
              { id: 'we8_w2', exerciseId: 'e15', nome: 'Curl con bilanciere EZ', distrettoMuscolare: 'Bicipiti', serie: 3, repMin: 8, repMax: 12, rir: 2, recupero: 90, tut: '3-0-1-0', noteTecniche: 'Gomiti fermi.', tecnicaIntensita: 'Nessuna', caricoPrevisto: '25kg' }
            ]
          },
          {
            id: 'd3_w2',
            nome: 'C: Legs',
            esercizi: [
              { id: 'we9_w2', exerciseId: 'e20', nome: 'Squat', distrettoMuscolare: 'Quadricipiti', serie: 4, repMin: 6, repMax: 8, rir: 2, recupero: 180, tut: '3-1-1-0', noteTecniche: 'Pausa in basso.', tecnicaIntensita: 'Nessuna', caricoPrevisto: '82.5kg' },
              { id: 'we10_w2', exerciseId: 'e21', nome: 'Leg Press', distrettoMuscolare: 'Quadricipiti', serie: 3, repMin: 10, repMax: 12, rir: 1, recupero: 120, tut: '3-0-1-0', noteTecniche: 'Non staccare il bacino.', tecnicaIntensita: 'Back-off', caricoPrevisto: '125kg' },
              { id: 'we11_w2', exerciseId: 'e24', nome: 'Stacco rumeno', distrettoMuscolare: 'Femorali', serie: 3, repMin: 8, repMax: 10, rir: 2, recupero: 120, tut: '3-0-1-0', noteTecniche: 'Spingi indietro bacino.', tecnicaIntensita: 'Nessuna', caricoPrevisto: '72.5kg' },
              { id: 'we12_w2', exerciseId: 'e29', nome: 'Calf Raise', distrettoMuscolare: 'Polpacci', serie: 4, repMin: 12, repMax: 15, rir: 1, recupero: 60, tut: '2-2-1-1', noteTecniche: 'Massimo allungamento.', tecnicaIntensita: 'Nessuna', caricoPrevisto: '40kg' }
            ]
          },
          {
            id: 'd4_w2',
            nome: 'D: Upper Body',
            esercizi: [
              { id: 'we13_w2', exerciseId: 'e2', nome: 'Distensioni con manubri su panca inclinata', distrettoMuscolare: 'Pettorali', serie: 3, repMin: 8, repMax: 12, rir: 2, recupero: 120, tut: '3-0-1-0', noteTecniche: 'Inclinazione 15-30 gradi.', tecnicaIntensita: 'Nessuna', caricoPrevisto: '22kg+22kg' },
              { id: 'we14_w2', exerciseId: 'e6', nome: 'Lat Machine presa neutra', distrettoMuscolare: 'Dorso', serie: 3, repMin: 8, repMax: 12, rir: 2, recupero: 120, tut: '3-0-1-0', noteTecniche: 'Presa larghezza spalle.', tecnicaIntensita: 'Nessuna', caricoPrevisto: '52.5kg' },
              { id: 'we15_w2', exerciseId: 'e11', nome: 'Alzate laterali con manubri', distrettoMuscolare: 'Spalle', serie: 4, repMin: 12, repMax: 15, rir: 1, recupero: 90, tut: '2-0-1-0', noteTecniche: 'Spingi manubri all\'infuori.', tecnicaIntensita: 'Myo-reps', caricoPrevisto: '12kg+12kg' },
              { id: 'we16_w2', exerciseId: 'e19', nome: 'French Press con bilanciere EZ', distrettoMuscolare: 'Tricipiti', serie: 3, repMin: 8, repMax: 12, rir: 2, recupero: 90, tut: '3-0-1-0', noteTecniche: 'Gomiti fermi.', tecnicaIntensita: 'Nessuna', caricoPrevisto: '22.5kg' }
            ]
          }
        ]
      }
    ]
  }
];

export const DEMO_TEMPLATES: WorkoutTemplate[] = [
  {
    id: 't1',
    nome: 'Full Body 3 giorni',
    obiettivo: 'Ipertrofia / Forza',
    livello: 'Principiante',
    allenamentiSettimanali: 3,
    durataSettimane: 4,
    noteGenerali: 'Allenamento a frequenza multipla ideale per principianti o intermedi con tempo ridotto. Ottimo per stimolare la sintesi proteica 3 volte a settimana.',
    giornate: [
      {
        id: 'td1_1',
        nome: 'Giorno 1: Spinta + Quad + Dorso',
        esercizi: [
          { id: 't_we1', exerciseId: 'e20', nome: 'Squat', distrettoMuscolare: 'Quadricipiti', serie: 3, repMin: 8, repMax: 10, rir: 2, recupero: 120, tut: '3-0-1-0', noteTecniche: 'Focus su discesa controllata.', tecnicaIntensita: 'Nessuna', caricoPrevisto: 'Barra' },
          { id: 't_we2', exerciseId: 'e1', nome: 'Chest Press convergente', distrettoMuscolare: 'Pettorali', serie: 3, repMin: 8, repMax: 12, rir: 2, recupero: 90, tut: '2-0-1-0', noteTecniche: 'Spremi il petto.', tecnicaIntensita: 'Nessuna' },
          { id: 't_we3', exerciseId: 'e5', nome: 'Lat Machine presa prona', distrettoMuscolare: 'Dorso', serie: 3, repMin: 8, repMax: 12, rir: 2, recupero: 90, tut: '3-0-1-0', noteTecniche: 'Tira con i gomiti.', tecnicaIntensita: 'Nessuna' },
          { id: 't_we4', exerciseId: 'e30', nome: 'Crunch', distrettoMuscolare: 'Addome', serie: 3, repMin: 12, repMax: 15, rir: 1, recupero: 60, tut: '2-0-1-0', noteTecniche: 'Senza forzare sul collo.' }
        ]
      },
      {
        id: 'td1_2',
        nome: 'Giorno 2: Cardine + Spalle + Braccia',
        esercizi: [
          { id: 't_we5', exerciseId: 'e24', nome: 'Stacco rumeno', distrettoMuscolare: 'Femorali', serie: 3, repMin: 8, repMax: 10, rir: 2, recupero: 120, tut: '3-0-1-0', noteTecniche: 'Fletti le anche.', tecnicaIntensita: 'Nessuna' },
          { id: 't_we6', exerciseId: 'e10', nome: 'Shoulder Press', distrettoMuscolare: 'Spalle', serie: 3, repMin: 8, repMax: 12, rir: 2, recupero: 90, tut: '3-0-1-0', noteTecniche: 'Spingi in alto.', tecnicaIntensita: 'Nessuna' },
          { id: 't_we7', exerciseId: 'e15', nome: 'Curl con bilanciere EZ', distrettoMuscolare: 'Bicipiti', serie: 3, repMin: 10, repMax: 12, rir: 2, recupero: 90, tut: '3-0-1-0', noteTecniche: 'Braccia stabili.', tecnicaIntensita: 'Nessuna' },
          { id: 't_we8', exerciseId: 'e18', nome: 'Push Down al cavo', distrettoMuscolare: 'Tricipiti', serie: 3, repMin: 10, repMax: 12, rir: 2, recupero: 90, tut: '2-0-1-0', noteTecniche: 'Schiaccia forte in basso.' }
        ]
      }
    ]
  },
  {
    id: 't2',
    nome: 'Upper / Lower 4 giorni',
    obiettivo: 'Ipertrofia',
    livello: 'Intermedio',
    allenamentiSettimanali: 4,
    durataSettimane: 6,
    noteGenerali: 'Divisione classica Upper Body / Lower Body ripetuta due volte. Permette di accumulare un volume ottimale per gruppo muscolare.',
    giornate: [
      {
        id: 'td2_1',
        nome: 'A: Upper Body',
        esercizi: [
          { id: 't_we9', exerciseId: 'e1', nome: 'Chest Press convergente', distrettoMuscolare: 'Pettorali', serie: 4, repMin: 8, repMax: 12, rir: 2, recupero: 120, tut: '3-0-1-0', noteTecniche: 'Ottimo isolamento.' },
          { id: 't_we10', exerciseId: 'e7', nome: 'Pulley basso', distrettoMuscolare: 'Dorso', serie: 4, repMin: 8, repMax: 12, rir: 2, recupero: 120, tut: '3-0-1-0', noteTecniche: 'Spalle addotte.' },
          { id: 't_we11', exerciseId: 'e11', nome: 'Alzate laterali con manubri', distrettoMuscolare: 'Spalle', serie: 4, repMin: 12, repMax: 15, rir: 1, recupero: 90, tut: '2-0-1-0', noteTecniche: 'Sulle spalle.' }
        ]
      },
      {
        id: 'td2_2',
        nome: 'B: Lower Body',
        esercizi: [
          { id: 't_we12', exerciseId: 'e21', nome: 'Leg Press', distrettoMuscolare: 'Quadricipiti', serie: 4, repMin: 8, repMax: 12, rir: 2, recupero: 120, tut: '3-0-1-0', noteTecniche: 'Spingi bene.' },
          { id: 't_we13', exerciseId: 'e25', nome: 'Leg Curl seduto', distrettoMuscolare: 'Femorali', serie: 3, repMin: 10, repMax: 12, rir: 1, recupero: 90, tut: '2-0-1-0', noteTecniche: 'Contrazione.' },
          { id: 't_we14', exerciseId: 'e26', nome: 'Hip Thrust', distrettoMuscolare: 'Glutei', serie: 3, repMin: 8, repMax: 12, rir: 2, recupero: 120, tut: '3-0-1-0', noteTecniche: 'Estensione forte.' }
        ]
      }
    ]
  },
  {
    id: 't3',
    nome: 'Push Pull Legs (PPL)',
    obiettivo: 'Massa Muscolare',
    livello: 'Intermedio',
    allenamentiSettimanali: 3,
    durataSettimane: 8,
    noteGenerali: 'Divisione iconica del bodybuilding: muscoli di spinta (petto/spalle/tricipiti), muscoli di trazione (schiena/bicipiti) e gambe. Massimizza il recupero locale.',
    giornate: [
      {
        id: 'td3_1',
        nome: 'Giorno 1: Push',
        esercizi: [
          { id: 't_we15', exerciseId: 'e2', nome: 'Distensioni con manubri su panca inclinata', distrettoMuscolare: 'Pettorali', serie: 3, repMin: 8, repMax: 12, rir: 2, recupero: 120, tut: '3-0-1-0' },
          { id: 't_we16', exerciseId: 'e10', nome: 'Shoulder Press', distrettoMuscolare: 'Spalle', serie: 3, repMin: 8, repMax: 12, rir: 2, recupero: 120, tut: '3-0-1-0' },
          { id: 't_we17', exerciseId: 'e18', nome: 'Push Down al cavo', distrettoMuscolare: 'Tricipiti', serie: 3, repMin: 10, repMax: 12, rir: 2, recupero: 90, tut: '3-0-1-0' }
        ]
      },
      {
        id: 'td3_2',
        nome: 'Giorno 2: Pull',
        esercizi: [
          { id: 't_we18', exerciseId: 'e5', nome: 'Lat Machine presa prona', distrettoMuscolare: 'Dorso', serie: 3, repMin: 8, repMax: 12, rir: 2, recupero: 120, tut: '3-0-1-0' },
          { id: 't_we19', exerciseId: 'e7', nome: 'Pulley basso', distrettoMuscolare: 'Dorso', serie: 3, repMin: 8, repMax: 12, rir: 2, recupero: 120, tut: '3-0-1-0' },
          { id: 't_we20', exerciseId: 'e15', nome: 'Curl con bilanciere EZ', distrettoMuscolare: 'Bicipiti', serie: 3, repMin: 10, repMax: 12, rir: 2, recupero: 90, tut: '3-0-1-0' }
        ]
      },
      {
        id: 'td3_3',
        nome: 'Giorno 3: Legs',
        esercizi: [
          { id: 't_we21', exerciseId: 'e21', nome: 'Leg Press', distrettoMuscolare: 'Quadricipiti', serie: 4, repMin: 10, repMax: 12, rir: 1, recupero: 120, tut: '3-0-1-0' },
          { id: 't_we22', exerciseId: 'e24', nome: 'Stacco rumeno', distrettoMuscolare: 'Femorali', serie: 3, repMin: 8, repMax: 10, rir: 2, recupero: 120, tut: '3-0-1-0' },
          { id: 't_we23', exerciseId: 'e29', nome: 'Calf Raise', distrettoMuscolare: 'Polpacci', serie: 4, repMin: 12, repMax: 15, rir: 1, recupero: 60, tut: '2-0-1-0' }
        ]
      }
    ]
  },
  {
    id: 't4',
    nome: 'Ipertrofia 4 giorni',
    obiettivo: 'Ipertrofia Estrema',
    livello: 'Avanzato',
    allenamentiSettimanali: 4,
    durataSettimane: 8,
    noteGenerali: 'Programma avanzato ad alto volume, focalizzato sulla massima tensione meccanica ed accumulo di metaboliti. Richiede un\'eccellente nutrizione e recupero.',
    giornate: [
      {
        id: 'td4_1',
        nome: 'Giorno 1: Petto e Bicipiti',
        esercizi: [
          { id: 't_we24', exerciseId: 'e2', nome: 'Distensioni con manubri su panca inclinata', distrettoMuscolare: 'Pettorali', serie: 4, repMin: 8, repMax: 12, rir: 2, recupero: 120, tut: '3-1-1-0', tecnicaIntensita: 'Top set' },
          { id: 't_we25', exerciseId: 'e3', nome: 'Croci ai cavi', distrettoMuscolare: 'Pettorali', serie: 3, repMin: 10, repMax: 15, rir: 1, recupero: 90, tut: '2-0-1-1', tecnicaIntensita: 'Drop set' },
          { id: 't_we26', exerciseId: 'e15', nome: 'Curl con bilanciere EZ', distrettoMuscolare: 'Bicipiti', serie: 4, repMin: 8, repMax: 12, rir: 2, recupero: 90, tut: '3-0-1-0' }
        ]
      },
      {
        id: 'td4_2',
        nome: 'Giorno 2: Gambe Complete',
        esercizi: [
          { id: 't_we27', exerciseId: 'e20', nome: 'Squat', distrettoMuscolare: 'Quadricipiti', serie: 4, repMin: 6, repMax: 8, rir: 2, recupero: 180, tut: '3-1-1-0' },
          { id: 't_we28', exerciseId: 'e25', nome: 'Leg Curl seduto', distrettoMuscolare: 'Femorali', serie: 4, repMin: 10, repMax: 12, rir: 1, recupero: 90, tut: '2-0-1-1', tecnicaIntensita: 'Rest pause' },
          { id: 't_we29', exerciseId: 'e26', nome: 'Hip Thrust', distrettoMuscolare: 'Glutei', serie: 3, repMin: 8, repMax: 12, rir: 2, recupero: 120, tut: '3-0-1-0' }
        ]
      },
      {
        id: 'td4_3',
        nome: 'Giorno 3: Dorso e Tricipiti',
        esercizi: [
          { id: 't_we30', exerciseId: 'e5', nome: 'Lat Machine presa prona', distrettoMuscolare: 'Dorso', serie: 4, repMin: 8, repMax: 12, rir: 2, recupero: 120, tut: '3-0-1-0' },
          { id: 't_we31', exerciseId: 'e7', nome: 'Pulley basso', distrettoMuscolare: 'Dorso', serie: 4, repMin: 8, repMax: 12, rir: 2, recupero: 120, tut: '3-0-1-0' },
          { id: 't_we32', exerciseId: 'e19', nome: 'French Press con bilanciere EZ', distrettoMuscolare: 'Tricipiti', serie: 4, repMin: 8, repMax: 12, rir: 2, recupero: 90, tut: '3-0-1-0' }
        ]
      },
      {
        id: 'td4_4',
        nome: 'Giorno 4: Spalle e Addome',
        esercizi: [
          { id: 't_we33', exerciseId: 'e10', nome: 'Shoulder Press', distrettoMuscolare: 'Spalle', serie: 4, repMin: 8, repMax: 12, rir: 2, recupero: 120, tut: '3-0-1-0' },
          { id: 't_we34', exerciseId: 'e11', nome: 'Alzate laterali con manubri', distrettoMuscolare: 'Spalle', serie: 4, repMin: 12, repMax: 15, rir: 1, recupero: 90, tut: '2-0-1-0', tecnicaIntensita: 'Myo-reps' },
          { id: 't_we35', exerciseId: 'e31', nome: 'Plank', distrettoMuscolare: 'Addome', serie: 3, repMin: 45, repMax: 60, rir: 0, recupero: 60, tut: 'Isometrico' }
        ]
      }
    ]
  }
];

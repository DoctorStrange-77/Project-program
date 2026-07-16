/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Exercise } from '../types';

export const INITIAL_EXERCISES: Exercise[] = [
  // PETTORALI (4)
  {
    id: 'e1',
    nome: 'Chest Press convergente',
    distrettoMuscolare: 'Pettorali',
    distrettiSecondari: ['Tricipiti', 'Spalle'],
    attrezzatura: 'Macchinario',
    patternMovimento: 'Spinta orizzontale',
    livelloDifficolta: 'Principiante',
    descrizione: 'Spinta guidata ottimale per isolare i pettorali minimizzando il coinvolgimento dei stabilizzatori.'
  },
  {
    id: 'e2',
    nome: 'Distensioni con manubri su panca inclinata',
    distrettoMuscolare: 'Pettorali',
    distrettiSecondari: ['Spalle (deltoide anteriore)', 'Tricipiti'],
    attrezzatura: 'Manubri',
    patternMovimento: 'Spinta inclinata',
    livelloDifficolta: 'Intermedio',
    descrizione: 'Ottimo esercizio per lo sviluppo dei fasci claveari del grande pettorale.'
  },
  {
    id: 'e3',
    nome: 'Croci ai cavi',
    distrettoMuscolare: 'Pettorali',
    distrettiSecondari: ['Spalle'],
    attrezzatura: 'Cavi',
    patternMovimento: 'Adduzione omerale',
    livelloDifficolta: 'Intermedio',
    descrizione: 'Tensione continua sui pettorali in tutto il ROM, eccellente per la fase di accorciamento.'
  },
  {
    id: 'e4',
    nome: 'Dip alle parallele',
    distrettoMuscolare: 'Pettorali',
    distrettiSecondari: ['Tricipiti', 'Spalle'],
    attrezzatura: 'Corpo libero',
    patternMovimento: 'Spinta verticale',
    livelloDifficolta: 'Avanzato',
    descrizione: 'Esercizio multiarticolare intenso per il petto inferiore e i tricipiti. Inclinarsi leggermente in avanti.'
  },

  // DORSO (5)
  {
    id: 'e5',
    nome: 'Lat Machine presa prona',
    distrettoMuscolare: 'Dorso',
    distrettiSecondari: ['Bicipiti', 'Spalle'],
    attrezzatura: 'Macchinario',
    patternMovimento: 'Tirata verticale',
    livelloDifficolta: 'Principiante',
    descrizione: 'Esercizio fondamentale per lo sviluppo del gran dorsale. Concentrarsi sul tirare con i gomiti.'
  },
  {
    id: 'e6',
    nome: 'Lat Machine presa neutra',
    distrettoMuscolare: 'Dorso',
    distrettiSecondari: ['Bicipiti', 'Brachiale'],
    attrezzatura: 'Macchinario',
    patternMovimento: 'Tirata verticale',
    livelloDifficolta: 'Principiante',
    descrizione: 'Presa più favorevole per l\'articolazione della spalla e ottimo coinvolgimento del gran dorsale e rotondo.'
  },
  {
    id: 'e7',
    nome: 'Pulley basso',
    distrettoMuscolare: 'Dorso',
    distrettiSecondari: ['Bicipiti', 'Trapezio'],
    attrezzatura: 'Cavi',
    patternMovimento: 'Tirata orizzontale',
    livelloDifficolta: 'Principiante',
    descrizione: 'Tirata orizzontale ideale per dare spessore alla schiena, coinvolgendo dorsali e adduttori delle scapole.'
  },
  {
    id: 'e8',
    nome: 'T-Bar Row con appoggio toracico',
    distrettoMuscolare: 'Dorso',
    distrettiSecondari: ['Bicipiti', 'Trapezio', 'Spalle posteriore'],
    attrezzatura: 'Macchinario',
    patternMovimento: 'Tirata orizzontale',
    livelloDifficolta: 'Intermedio',
    descrizione: 'L\'appoggio toracico elimina lo stress sulla bassa schiena, permettendo di caricare e isolare il dorso.'
  },
  {
    id: 'e9',
    nome: 'Rematore con manubrio',
    distrettoMuscolare: 'Dorso',
    distrettiSecondari: ['Bicipiti', 'Core'],
    attrezzatura: 'Manubri',
    patternMovimento: 'Tirata orizzontale',
    livelloDifficolta: 'Intermedio',
    descrizione: 'Esercizio unilaterale che permette un ROM completo e corregge eventuali asimmetrie muscolari.'
  },

  // SPALLE (5)
  {
    id: 'e10',
    nome: 'Shoulder Press',
    distrettoMuscolare: 'Spalle',
    distrettiSecondari: ['Tricipiti'],
    attrezzatura: 'Macchinario',
    patternMovimento: 'Spinta verticale',
    livelloDifficolta: 'Principiante',
    descrizione: 'Spinta verticale guidata per sviluppare la forza e l\'ipertrofia dei deltoidi (soprattutto anteriore).'
  },
  {
    id: 'e11',
    nome: 'Alzate laterali con manubri',
    distrettoMuscolare: 'Spalle',
    distrettiSecondari: ['Trapezio'],
    attrezzatura: 'Manubri',
    patternMovimento: 'Abduzione omerale',
    livelloDifficolta: 'Principiante',
    descrizione: 'Isolamento puro del deltoide laterale. Mantenere i gomiti leggermente flessi e non superare l\'altezza delle spalle.'
  },
  {
    id: 'e12',
    nome: 'Alzate laterali al cavo',
    distrettoMuscolare: 'Spalle',
    distrettiSecondari: ['Trapezio'],
    attrezzatura: 'Cavi',
    patternMovimento: 'Abduzione omerale',
    livelloDifficolta: 'Intermedio',
    descrizione: 'Il cavo garantisce tensione costante lungo tutto il percorso del movimento, specialmente nei primi gradi.'
  },
  {
    id: 'e13',
    nome: 'Reverse Pec Deck',
    distrettoMuscolare: 'Spalle',
    distrettiSecondari: ['Dorso superiore', 'Trapezio'],
    attrezzatura: 'Macchinario',
    patternMovimento: 'Abduzione orizzontale',
    livelloDifficolta: 'Principiante',
    descrizione: 'Ottimo isolamento per il deltoide posteriore e la muscolatura interscapolare.'
  },
  {
    id: 'e14',
    nome: 'Face Pull',
    distrettoMuscolare: 'Spalle',
    distrettiSecondari: ['Dorso superiore', 'Cuffia dei rotatori'],
    attrezzatura: 'Cavi',
    patternMovimento: 'Tirata alta',
    livelloDifficolta: 'Intermedio',
    descrizione: 'Favoloso per la salute della spalla, deltoidi posteriori ed extrarotatori.'
  },

  // BICIPITI (3)
  {
    id: 'e15',
    nome: 'Curl con bilanciere EZ',
    distrettoMuscolare: 'Bicipiti',
    distrettiSecondari: ['Avambracci'],
    attrezzatura: 'Bilanciere',
    patternMovimento: 'Flessione del gomito',
    livelloDifficolta: 'Principiante',
    descrizione: 'La barra sagomata riduce lo stress sui polsi rispetto al bilanciere dritto classico.'
  },
  {
    id: 'e16',
    nome: 'Curl manubri su panca inclinata',
    distrettoMuscolare: 'Bicipiti',
    distrettiSecondari: ['Brachiale'],
    attrezzatura: 'Manubri',
    patternMovimento: 'Flessione del gomito',
    livelloDifficolta: 'Intermedio',
    descrizione: 'La panca inclinata pone il bicipite (capo lungo) in massimo allungamento pre-contrazione.'
  },
  {
    id: 'e17',
    nome: 'Drag Curl con bilanciere',
    distrettoMuscolare: 'Bicipiti',
    distrettiSecondari: ['Avambracci'],
    attrezzatura: 'Bilanciere',
    patternMovimento: 'Flessione del gomito',
    livelloDifficolta: 'Intermedio',
    descrizione: 'Il bilanciere sale rasentando il corpo portando i gomiti indietro. Isolamento del capo lungo.'
  },

  // TRICIPITI (2)
  {
    id: 'e18',
    nome: 'Push Down al cavo',
    distrettoMuscolare: 'Tricipiti',
    distrettiSecondari: [],
    attrezzatura: 'Cavi',
    patternMovimento: 'Estensione del gomito',
    livelloDifficolta: 'Principiante',
    descrizione: 'Esercizio fondamentale di isolamento per i tricipiti, con focus sul capo laterale e mediale.'
  },
  {
    id: 'e19',
    nome: 'French Press con bilanciere EZ',
    distrettoMuscolare: 'Tricipiti',
    distrettiSecondari: ['Spalle'],
    attrezzatura: 'Bilanciere',
    patternMovimento: 'Estensione del gomito',
    livelloDifficolta: 'Intermedio',
    descrizione: 'Estensione dei gomiti sdraiati su panca, porta in tensione allungata il capo lungo del tricipite.'
  },

  // QUADRICIPITI (4)
  {
    id: 'e20',
    nome: 'Squat',
    distrettoMuscolare: 'Quadricipiti',
    distrettiSecondari: ['Glutei', 'Core', 'Erettori spinali'],
    attrezzatura: 'Bilanciere',
    patternMovimento: 'Accosciata',
    livelloDifficolta: 'Avanzato',
    descrizione: 'Re indiscusso degli esercizi per gli arti inferiori. Richiede ottima mobilità e stabilità del core.'
  },
  {
    id: 'e21',
    nome: 'Leg Press',
    distrettoMuscolare: 'Quadricipiti',
    distrettiSecondari: ['Glutei', 'Femorali'],
    attrezzatura: 'Macchinario',
    patternMovimento: 'Spinta inferiore',
    livelloDifficolta: 'Principiante',
    descrizione: 'Consente di spingere carichi elevati per stimolare le cosce isolando la colonna vertebrale.'
  },
  {
    id: 'e22',
    nome: 'Leg Extension',
    distrettoMuscolare: 'Quadricipiti',
    distrettiSecondari: [],
    attrezzatura: 'Macchinario',
    patternMovimento: 'Estensione ginocchio',
    livelloDifficolta: 'Principiante',
    descrizione: 'Esercizio di isolamento puro per i quadricipiti. Ottimo per pre-affaticamento o pump finale.'
  },
  {
    id: 'e23',
    nome: 'Bulgarian Split Squat',
    distrettoMuscolare: 'Quadricipiti',
    distrettiSecondari: ['Glutei', 'Femorali'],
    attrezzatura: 'Manubri',
    patternMovimento: 'Accosciata unilaterale',
    livelloDifficolta: 'Intermedio',
    descrizione: 'Esercizio unilaterale eccezionale per stabilità, forza e sviluppo simmetrico di quadricipiti e glutei.'
  },

  // FEMORALI (2)
  {
    id: 'e24',
    nome: 'Stacco rumeno',
    distrettoMuscolare: 'Femorali',
    distrettiSecondari: ['Glutei', 'Erettori spinali'],
    attrezzatura: 'Bilanciere',
    patternMovimento: 'Cardine d\'anca (Hinge)',
    livelloDifficolta: 'Intermedio',
    descrizione: 'Focus sull\'allungamento eccentrico della catena cinetica posteriore (femorali e glutei).'
  },
  {
    id: 'e25',
    nome: 'Leg Curl seduto',
    distrettoMuscolare: 'Femorali',
    distrettiSecondari: ['Polpacci'],
    attrezzatura: 'Macchinario',
    patternMovimento: 'Flessione ginocchio',
    livelloDifficolta: 'Principiante',
    descrizione: 'Isolamento dei femorali in posizione seduta, ottimale per stimolare i muscoli in allungamento.'
  },

  // GLUTEI (3)
  {
    id: 'e26',
    nome: 'Hip Thrust',
    distrettoMuscolare: 'Glutei',
    distrettiSecondari: ['Femorali'],
    attrezzatura: 'Bilanciere',
    patternMovimento: 'Estensione d\'anca',
    livelloDifficolta: 'Intermedio',
    descrizione: 'Il miglior esercizio per l\'ipertrofia del grande gluteo, che riceve massima tensione in accorciamento.'
  },
  {
    id: 'e27',
    nome: 'Cable Kickback',
    distrettoMuscolare: 'Glutei',
    distrettiSecondari: [],
    attrezzatura: 'Cavi',
    patternMovimento: 'Estensione d\'anca',
    livelloDifficolta: 'Intermedio',
    descrizione: 'Estensioni posteriori al cavo basso per isolare e modellare i glutei con tensione costante.'
  },
  {
    id: 'e28',
    nome: 'Abductor Machine',
    distrettoMuscolare: 'Glutei',
    distrettiSecondari: [],
    attrezzatura: 'Macchinario',
    patternMovimento: 'Abduzione d\'anca',
    livelloDifficolta: 'Principiante',
    descrizione: 'Isolamento specifico del medio e piccolo gluteo. Variare inclinazione busto per diverse tensioni.'
  },

  // POLPACCI (1)
  {
    id: 'e29',
    nome: 'Calf Raise',
    distrettoMuscolare: 'Polpacci',
    distrettiSecondari: [],
    attrezzatura: 'Macchinario',
    patternMovimento: 'Flessione plantare',
    livelloDifficolta: 'Principiante',
    descrizione: 'Sollevamenti sulle punte per lo sviluppo del polpaccio (gastrocnemio e soleo).'
  },

  // ADDOME (3)
  {
    id: 'e30',
    nome: 'Crunch',
    distrettoMuscolare: 'Addome',
    distrettiSecondari: [],
    attrezzatura: 'Corpo libero',
    patternMovimento: 'Flessione della colonna',
    livelloDifficolta: 'Principiante',
    descrizione: 'Flessione guidata del busto per isolare il retto dell\'addome. Evitare di tirare il collo.'
  },
  {
    id: 'e31',
    nome: 'Plank',
    distrettoMuscolare: 'Addome',
    distrettiSecondari: ['Spalle', 'Core intero'],
    attrezzatura: 'Corpo libero',
    patternMovimento: 'Antiestensione (Isometrico)',
    livelloDifficolta: 'Principiante',
    descrizione: 'Isometria fondamentale per il rinforzo della stabilità profonda del core.'
  },
  {
    id: 'e32',
    nome: 'Leg Raise alle parallele',
    distrettoMuscolare: 'Addome',
    distrettiSecondari: ['Flessori dell\'anca'],
    attrezzatura: 'Corpo libero',
    patternMovimento: 'Flessione d\'anca',
    livelloDifficolta: 'Intermedio',
    descrizione: 'Sollevamento gambe tese o flesse per lavorare la parte inferiore dell\'addome e la forza isometrica delle braccia.'
  }
];

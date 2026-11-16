export const courses = [
  {
    title: 'Anfänger',
    description: 'Das Brett und alle sieben Figuren kennenlernen.',
    lessons: [
      {
        id: 'board', title: 'Brett und Spielziel',
        description: 'Die Figuren ziehen von Schnittpunkt zu Schnittpunkt. In der Mitte liegt der Fluss, an den Enden der Palast. Du gewinnst, wenn dein Gegner keinen legalen Zug mehr hat.',
        exercises: [
          { board: 'kd10 Ke1 Ra3', goal: 'Beginne mit einem geraden Zug. Ziehe den roten Wagen zwei Schnittpunkte nach oben, von a3 nach a5.', move: 'a3 a5', why: 'Der Wagen kann mehrere freie Schnittpunkte in einer geraden Linie überqueren.' },
        ],
      },
      {
        id: 'general', title: 'General',
        description: 'Dein General zieht einen Punkt gerade und bleibt im Palast. Zwischen den beiden Generalen muss eine Figur stehen, wenn sie auf derselben Linie stehen.',
        exercises: [
          { board: 'kd10 Ke1', goal: 'Ziehe den General einen Punkt nach vorn.', move: 'e1 e2', why: 'Ein Schritt gerade nach vorn bleibt innerhalb des Palasts.' },
          { board: 'kd10 Ke1', goal: 'Finde den legalen seitlichen Zug. Auf der d-Linie steht der schwarze General.', move: 'e1 f1', why: 'Auf d1 würden sich beide Generale ohne Hindernis gegenüberstehen. Auf f1 ist der General sicher.' },
        ],
      },
      {
        id: 'advisor', title: 'Berater',
        description: 'Der Berater zieht genau einen Punkt diagonal und bleibt im Palast.',
        exercises: [
          { board: 'kd10 Ke1 Af1', goal: 'Ziehe den Berater von der Ecke in die Mitte des Palasts.', move: 'f1 e2', why: 'Die Palastdiagonale führt von f1 genau einen Punkt nach e2.' },
          { board: 'kd10 Ke1 Ae2', goal: 'Ziehe den Berater in die vordere linke Palastecke.', move: 'e2 d3', why: 'Von der Mitte aus erreicht der Berater jede freie Ecke auf einer Diagonale.' },
        ],
      },
      {
        id: 'elephant', title: 'Elefant',
        description: 'Der Elefant zieht genau zwei Punkte diagonal. Ein Stein auf der Mitte blockiert ihn. Er bleibt auf seiner Flussseite.',
        exercises: [
          { board: 'kd10 Ke1 Ec1', goal: 'Ziehe den Elefanten von c1 diagonal nach rechts vorn.', move: 'c1 e3', why: 'Die Route über d2 ist frei und e3 liegt auf der roten Flussseite.' },
          { board: 'kd10 Ke1 Ee3 Pf4', goal: 'Ziehe den Elefanten nach vorn in Richtung Fluss. Der Soldat blockiert die rechte Diagonale.', move: 'e3 c5', why: 'Über d4 ist der Weg nach c5 frei. Über f4 kommt der Elefant nicht hinweg.' },
        ],
      },
      {
        id: 'horse', title: 'Pferd',
        description: 'Das Pferd zieht einen Punkt gerade und dann einen Punkt diagonal nach außen. Eine Figur auf dem ersten Punkt blockiert den Zug.',
        exercises: [
          { board: 'kd10 Ke1 Hb1', goal: 'Ziehe das Pferd zwei Reihen nach vorn und eine Linie nach rechts.', move: 'b1 c3', why: 'Das Pferd zieht über b2 nach c3. Der erste Punkt b2 ist frei.' },
          { board: 'kd10 Ke1 He4 Pe5 pc5', goal: 'Schlage den schwarzen Soldaten. Vor dem Pferd steht ein eigener Soldat.', move: 'e4 c5', why: 'Der Schlag führt über d4. Der Soldat auf e5 blockiert nur Wege, die mit dem Schritt nach vorn beginnen.' },
        ],
      },
      {
        id: 'chariot', title: 'Wagen',
        description: 'Der Wagen zieht beliebig weit gerade. Er kann auf keiner Seite über eine Figur springen.',
        exercises: [
          { board: 'kd10 Ke1 Ra2', goal: 'Ziehe den Wagen auf derselben Reihe von a2 nach h2.', move: 'a2 h2', why: 'Alle Schnittpunkte zwischen a2 und h2 sind frei.' },
          { board: 'kd10 Ke1 Ra2 pa6 Pa7', goal: 'Schlage den schwarzen Soldaten mit dem Wagen.', move: 'a2 a6', why: 'Der Wagen stoppt auf a6 und nimmt den Soldaten vom Brett.' },
        ],
      },
      {
        id: 'cannon', title: 'Kanone',
        description: 'Die Kanone zieht gerade. Für einen Schlag braucht sie genau eine Figur zwischen sich und dem Ziel. Diese Zwischenfigur bleibt stehen.',
        exercises: [
          { board: 'kd10 Ke1 Cb3', goal: 'Ziehe die Kanone gerade von b3 nach b5.', move: 'b3 b5', why: 'Bei einem Zug auf einen leeren Punkt darf die Kanone keine Figur überspringen.' },
          { board: 'kd10 Ke1 Cb3 Pb5 pb8', goal: 'Schlage den schwarzen Soldaten auf b8.', move: 'b3 b8', why: 'Der rote Soldat auf b5 ist die einzige Zwischenfigur. Deshalb ist der Schlag legal.' },
        ],
      },
      {
        id: 'soldier', title: 'Soldat',
        description: 'Der Soldat zieht einen Punkt gerade nach vorn. Jenseits des Flusses darf er zusätzlich einen Punkt seitwärts ziehen.',
        exercises: [
          { board: 'kd10 Ke1 Pc5', goal: 'Überquere mit dem Soldaten den Fluss.', move: 'c5 c6', why: 'c6 ist der erste Schnittpunkt auf der anderen Flussseite.' },
          { board: 'kd10 Ke1 Pc6 pb6', goal: 'Schlage mit dem Soldaten seitwärts nach links.', move: 'c6 b6', why: 'Der Soldat steht bereits jenseits des Flusses und darf seitlich schlagen.' },
        ],
      },
    ],
  },
  {
    title: 'Fortgeschritten',
    description: 'Schach abwehren, Fesselungen erkennen und Material gewinnen.',
    lessons: [
      {
        id: 'defend', title: 'Schach abwehren',
        description: 'Schach kannst du durch Ausweichen, Dazwischenziehen oder Schlagen der angreifenden Figur abwehren.',
        exercises: [
          { board: 'kf10 Ke1 re6 Ra3', goal: 'Wehre das Schach ab, indem du deinen Wagen zwischen den General und den schwarzen Wagen ziehst.', move: 'a3 e3', why: 'Dein Wagen unterbricht auf e3 die Angriffslinie.' },
          { board: 'kf10 Ke1 re4 Rh4', goal: 'Wehre das Schach ab und gewinne dabei den schwarzen Wagen.', move: 'h4 e4', why: 'Du entfernst die angreifende Figur und behältst deinen Wagen.' },
        ],
      },
      {
        id: 'pin', title: 'Die offene Generalslinie',
        description: 'Eine Figur zwischen den Generalen kann gefesselt sein. Sie darf die Linie nicht öffnen.',
        exercises: [
          { board: 'ke10 Ke1 He4 pb6 Rb4', goal: 'Das Pferd ist gefesselt. Schlage den schwarzen Soldaten mit einer anderen Figur.', move: 'b4 b6', why: 'Der Wagen kann schlagen, während das Pferd auf e4 stehen bleibt. Ein Pferdezug würde die Generale freilegen.' },
        ],
      },
      {
        id: 'winning-capture', title: 'Finde den besten Schlagzug',
        description: 'Vergleiche, was du gewinnst und ob der Gegner sofort zurückschlagen kann.',
        exercises: [
          { board: 'kd10 Ke1 Cb3 Pb5 rb8 Ra4 pa6', goal: 'Rot kann zwei schwarze Figuren schlagen. Welcher Schlag gewinnt mehr Material?', move: 'b3 b8', why: 'Die Kanone gewinnt den ungedeckten Wagen. Der Schlag auf a6 gewinnt lediglich einen Soldaten.' },
          { board: 'kd10 Ke1 Ra4 pa6 rb4 ri4', goal: 'Finde den Schlag, der Material gewinnt, ohne deinen Wagen zu verlieren.', move: 'a4 a6', why: 'Der Wagen auf i4 deckt b4. Mit a4–a6 gewinnst du stattdessen den ungedeckten Soldaten.' },
        ],
      },
    ],
  },
  {
    title: 'Profi',
    description: 'Mattbilder erkennen und forcierte Zugfolgen berechnen.',
    lessons: [
      {
        id: 'horse-mate', title: 'Matt in 1 · Wagen und Pferd',
        description: 'Ein Schach ist erst Matt, wenn auch alle Fluchtpunkte und Abwehrzüge wegfallen.',
        exercises: [
          { board: 'kf10 Ph9 Hg7 Ri7 Kd1', goal: 'Setze Schwarz mit einem einzigen Zug matt.', move: 'i7 i10', why: 'Der Wagen kontrolliert die oberste Reihe. Das Pferd auf g7 nimmt dem General den Fluchtpunkt f9.' },
        ],
      },
      {
        id: 'cannon-mate', title: 'Matt in 1 · Wagen und Kanone',
        description: 'Ein Wagen kann den General angreifen, während eine Kanone Fluchtpunkte kontrolliert, sobald sie eine Zwischenfigur hat.',
        exercises: [
          { board: 'kd10 Ph9 Ci9 Rf8 Kf1', goal: 'Finde den Mattzug. Achte darauf, welche Linie die Kanone mit dem Soldaten kontrolliert.', move: 'f8 f10', why: 'Der Wagen kontrolliert die oberste Reihe. Die Kanone deckt d9 über den roten Soldaten auf h9.' },
        ],
      },
      {
        id: 'mate-two', title: 'Matt in 2',
        description: 'Suche zuerst ein Schach, das dem Gegner nur eine Antwort lässt. Berechne danach den Mattzug.',
        exercises: [
          { board: 'kd10 Hg7 Rh7 Ke1', goal: 'Finde den ersten Zug der Mattfolge. Schwarz antwortet automatisch.', move: 'g7 f9', reply: 'd10 d9', finish: 'h7 d7', why: 'Das Pferd erzwingt d9. Der Wagen setzt auf d7 matt und das Pferd nimmt dem General die Flucht nach d8.' },
        ],
      },
    ],
  },
];

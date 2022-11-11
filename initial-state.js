export let initialBoard = {
    
  a1: {
      color: 'white',
      piece: 'rook',
      image: '♖'
      },
  b1:  {
      color: 'white',
      piece: 'knight',
      image: '♘'
      },
  c1:  {
      color: 'white',
      piece: 'bishop',
      image: '♗'
      },
  d1:  {
      color: 'white',
      piece: 'queen',
      image: '♕'
      },
  e1:  {
      color: 'white',
      piece: 'king',
      image: '♔'
      },
  f1:  {
      color: 'white',
      piece: 'bishop',
      image: '♗'
      },
  g1: {
      color: 'white',
      piece: 'knight',
      image: '♘'
      },
  h1: {
      color: 'white',
      piece: 'rook',
      image: '♖'
      },
  a2: {
      color: 'white',
      piece: 'pawn',
      image: '♙'
      },
  b2:  {
      color: 'white',
      piece: 'pawn',
      image: '♙'
      },
  c2:  {
      color: 'white',
      piece: 'pawn',
      image: '♙'
      },
  d2:  {
      color: 'white',
      piece: 'pawn',
      image: '♙'
      },
  e2:  {
      color: 'white',
      piece: 'pawn',
      image: '♙'
      },
  f2:  {
      color: 'white',
      piece: 'pawn',
      image: '♙'
      },
  g2:  {
      color: 'white',
      piece: 'pawn',
      image: '♙'
      },
  h2:  {
      color: 'white',
      piece: 'pawn',
      image: '♙'
      },
  a3: false,
  b3: false,
  c3: false,
  d3: false,
  e3: false,
  f3: false,
  g3: false,
  h3: false,
  a4: false,
  b4: false,
  c4: false,
  d4: false,
  e4: false,
  f4: false,
  g4: false,
  h4: false,
  a5: false,
  b5: false,
  c5: false,
  d5: false,
  e5: false,
  f5: false,
  g5: false,
  h5: false,
  a6: false,
  b6: false,
  c6: false,
  d6: false,
  e6: false,
  f6: false,
  g6: false,
  h6: false,
  a7:  {
      color: 'black',
      piece: 'pawn',
      image: '♟'
      },
  b7:  {
      color: 'black',
      piece: 'pawn',
      image: '♟'
      },
  c7:  {
      color: 'black',
      piece: 'pawn',
      image: '♟'
      },
  d7:  {
      color: 'black',
      piece: 'pawn',
      image: '♟'
      },
  e7:  {
      color: 'black',
      piece: 'pawn',
      image: '♟'
      },
  f7:  {
      color: 'black',
      piece: 'pawn',
      image: '♟'
      },
  g7:  {
      color: 'black',
      piece: 'pawn',
      image: '♟'
      },
  h7:  {
      color: 'black',
      piece: 'pawn',
      image: '♟'
      },
  a8:  {
      color: 'black',
      piece: 'rook',
      image: '♜'
      },
  b8:  {
      color: 'black',
      piece: 'knight',
      image: '♞'
      },
  c8:  {
      color: 'black',
      piece: 'bishop',
      image: '♝'
      },
  d8:  {
      color: 'black',
      piece: 'queen',
      image: '♛'
      },
  e8:  { 
      color: 'black',
      piece: 'king',
      image: '♚'
      },
  f8:  {
      color: 'black',
      piece: 'bishop',
      image: '♝'
      },
  g8:  {
      color: 'black',
      piece: 'knight',
      image: '♞'
      },
  h8:  {
      color: 'black',
      piece: 'rook',
      image: '♜'
      } 
}

export let initialCastling = {
  white: {
    a1: {
      isActive: true,
      spacesBetween: [
        {space: 'b1', condition: 'empty'},
        {space: 'c1', condition: 'empty'},
        {space: 'd1', condition: 'empty'}
      ]
    },
    h1: {
      isActive: true,
      spacesBetween: [
        {space: 'f1', condition: 'empty'},
        {space: 'g1', condition: 'empty'}
      ]
    }
  },
  black: {
    a8: {
      isActive: true,
      spacesBetween: [
        {space: 'b8', condition: 'empty'}, 
        {space: 'c8', condition: 'empty'}, 
        {space: 'd8', condition: 'empty'}
      ]
    },
    h8: {
      isActive: true,
      spacesBetween: [
        {space: 'f8', condition: 'empty'}, 
        {space: 'g8', condition: 'empty'}]
    }
  }
}
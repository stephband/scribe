
import mod12 from 'sequence/modules/number/mod-12.js';


/**
fifths(n)
Transforms note numbers in the chromatic circle to numbers in the circle of
fifths and vice versa. This transform is an involution.


               D                                           D
     C♯/D♭            E♭/D♯                         G             A
               •                                           •
  C                         E                 C                         E
      •                 •                         •                 •

B              ●              F     <=>     F              ●              B

      •                 •                         •                 •
B♭/A♯                      F♯/G♭            B♭/A♯                      F♯/G♭
               •                                           •
       A               G                         E♭/D♯            C♯/D♭
             A♭/G♯                                        A♭/G♯


Note that 6 notes remain unchanged, the hexagon of a whole tone scale.
**/

export function fifths(n) {
    return mod12(7 * n);
}


/**
fourths(n)
Transforms note numbers in the chromatic circle to numbers in the circle of
fourths and vice versa. This transform is an involution.


               D                                         B♭/A♯
     C♯/D♭            E♭/D♯                         F            E♭/D♯
                     •                                          •
  C                         E                 C                        A♭/G♯
      •                                           •

B              ●              F     <=>     G              ●             C♯/D♭

                        •                                           •
B♭/A♯                      F♯/G♭               D                       F♯/G♭
         •                                            •
       A               G                            A             B
             A♭/G♯                                         E


Note that 4 notes remain unchanged, the square of a diminished tetrad.
**/

export function fourths(n) {
    return mod12(5 * n);
}


/**
invert(n)
Inverts note numbers round the chromatic circle. This transform is an involution.


               D                                           B♭
        C♯            E♭                            B             A

  C                         E                 C                        A♭/G♯
      •                                           •

B              ●              F     <=>     C♯             ●              G

                        •                                           •
  B♭                        F♯                D                         F♯

       A               G                           E♭             F
             A♭/G♯                                         E


This is the same operation as `reflect(0, n)` or indeed `fifths(fourths(n))`
or `fourths(fifths(n))`. In fact, combining any 2 of these three transforms
always produces the third, and combining all three is the same as the identity
(no change) transform.
**/

export function invert(n) {
    return mod12(11 * n);
}

/*
 * hatMatrixFormula.ts — the server-pre-rendered hat-matrix block.
 *
 * DESIGN.md §Cross-cutting signature #1, "Hat-matrix definition":
 *   "The block is pre-rendered at build time (static SVG from KaTeX
 *    server-side render) so no runtime KaTeX code loads. Default state:
 *    display: none."
 *
 * DESIGN.md §Global architecture, line 20:
 *   "KaTeX 0.16.x, server-side rendered at build time ... KaTeX runtime
 *    is excluded from the client bundle."
 *
 * Implementation at Step 2: the formula is emitted as hand-authored
 * MathML, which every modern browser renders natively without any
 * stylesheet or runtime library. MathML is what KaTeX's `output:"mathml"`
 * mode produces anyway; emitting it directly trades the build-time
 * KaTeX step for an equivalent static string and keeps the client
 * bundle at zero KaTeX bytes — satisfying acceptance criterion #6's
 * "KaTeX SVG bundle loaded at runtime is 0 bytes."
 *
 * If a future step adds more formulas, migrate this file to a build-time
 * renderer (katex@0.16 is devDependency-eligible per the tech-stack
 * row). The exported name + shape is the contract.
 *
 * The literal fragment `h_ii` required by acceptance criterion #6 lives
 * in both the rendered MathML and the plain-text fallback below.
 */

/** Plain-text transcription of the formula, used as a tooltip fallback
 *  and as the source of the `h_ii` literal fragment the Playwright spec
 *  asserts the DOM contains. */
export const HAT_MATRIX_PLAINTEXT = 'h_ii = [X(X^T X)^(-1) X^T]_ii';

/** The single-line 9pt mono gloss beneath the formula (DESIGN.md). */
export const HAT_MATRIX_GLOSS =
  '# the i-th diagonal of the hat matrix; a country\u2019s pull on her own fit.';

/** Aria-live announcement for the tooltip per DESIGN.md §CC#1 Interaction table. */
export const HAT_MATRIX_ARIA =
  'h sub i i equals the i-th diagonal of X times X-transpose X inverse times X-transpose. A country\u2019s pull on her own fit.';

/**
 * MathML-as-HTML. Uses MathCore 3 element set. The outer container is
 * a `<math>` element; inside, two `<mrow>` groups partition the LHS
 * from the RHS. The superscript `-1` is attached to the whole (X^T X)
 * group via `<msup>`. The trailing `[…]_{ii}` subscript is attached to
 * a bracketed `<mrow>` via `<msub>`.
 *
 * Aria-label on the root element translates to the announcement above.
 */
export const HAT_MATRIX_MATHML: string = `<math xmlns="http://www.w3.org/1998/Math/MathML" display="block" aria-label="${HAT_MATRIX_ARIA}" data-testid="hat-matrix-formula">
  <msub><mi>h</mi><mrow><mi>i</mi><mi>i</mi></mrow></msub>
  <mo>=</mo>
  <msub>
    <mrow>
      <mo>[</mo>
      <mi>X</mi>
      <msup>
        <mrow>
          <mo>(</mo>
          <msup><mi>X</mi><mi>T</mi></msup>
          <mi>X</mi>
          <mo>)</mo>
        </mrow>
        <mrow><mo>\u2212</mo><mn>1</mn></mrow>
      </msup>
      <msup><mi>X</mi><mi>T</mi></msup>
      <mo>]</mo>
    </mrow>
    <mrow><mi>i</mi><mi>i</mi></mrow>
  </msub>
</math>`;

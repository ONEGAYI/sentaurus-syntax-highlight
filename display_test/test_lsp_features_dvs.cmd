; ============================================================
; SDE LSP Layer 1 Feature Test
; Tests: code folding, bracket diagnostics, definition extraction
; ============================================================

;; --- 1. Variable definitions (should appear in completions) ---
(define TboxTest 0.42)
(define Vds 3.3)
(define Vgs 1.2)
(define Lg 0.1)
(define Wg 10.0)

;; --- 2. Function definitions ---
(define (create-nmos-gate gate-length gate-width)
    (sdegeo:create-rectangle
        "Gate"
        "PolySilicon"
        (position 0 0 0)
        (position gate-width 0.05 gate-length)
    )
)

;; --- 3. Let bindings (nested scoping) ---
(define (calc-mobility temp)
    (let ((T0 300.0) 
          (mu0 1400.0)
          (alpha -2.2)
        )
        (let* ((ratio (/ temp T0)) 
               (exponent (* alpha (log ratio)))
            )
            (* mu0 (exp exponent))
        )
    )
)

;; --- 4. Multi-line S-expressions (test folding) ---
(sdegeo:create-rectangle
    "R.Source"
    "Silicon"
    (position 0.0 0.0 0.0)
    (position 2.0 0.5 0.1)
)

(sdegeo:create-rectangle
    "R.Drain"
    "Silicon"
    (position 8.0 0.0 0.0)
    (position 10.0 0.5 0.1)
)

(sdegeo:create-rectangle
    "R.Channel"
    "Silicon"
    (position 2.0 0.0 0.0)
    (position 8.0 0.5 0.1)
)

;; --- 5. Deeply nested (multi-level folding) ---
(sdegeo:define-contact-set
    "Source"
    "Silicon"
    (list
        (position 0.0 0.0 0.0)
        (position 2.0 0.0 0.0)
        (position 2.0 0.5 0.0)
        (position 0.0 0.5 0.0)
    )
    (list
        (list
            (position 0.0 0.0 0.0)
            (position 2.0 0.0 0.0)
        )
        (list
            (position 2.0 0.0 0.0)
            (position 2.0 0.5 0.0)
        )
    )
)

;; --- 6. Quote syntax sugar ---
(define material-list
    '("Silicon" "Oxide" "Nitride" "PolySilicon")
)

;; --- 7. Boolean and number literals ---
(define debug-mode #t)
(define use-cache #f)
(define pi 3.14159265)
(define avogadro 6.022e23)
(define boltzmann 8.617e-5)

;; --- 8. String with special chars ---
(define description "NMOS transistor L=0.1um W=10um")

;; --- 9. Bracket diagnostic test ---
;; Uncomment the line below to test unclosed bracket error (red wave):
; (define unclosed
;; Uncomment the line below to test extra closing bracket warning (yellow wave):
; (define x 1))

;; --- 10. SDE API calls (test function completion) ---
(sdedr:define-constant-profile "DC.Substrate"
    "BoronActiveConcentration" 1e15)
(sdedr:define-refinement-function "Ref.Grid"
    "MaxLenInt"
    "Substrate" "RefinementRegion" 0.05)
(sde:build-mesh "snmesh" "" "n@node@") ; should fix `@foo@` syntax highlighting

;; --- 11. Symbol index test (Phase 3) ---
;; Region definitions
(sdegeo:create-rectangle
    (position 4.0 0.0 0.0)
    (position 6.0 0.5 0.1)
    "PolySilicon"
    "R.Gate"
)

;; Contact definition
(sdegeo:define-contact-set
    "Drain"
    4.0
    "Red"
    "solid"
)

;; Region references (should not trigger undefined diagnostic)
(sdedr:define-refinement-region "Place.Gate" "Ref.Grid" "R.Gate")

;; Contact reference
(sdegeo:set-contact (list) "Drain")

;; Undefined region reference (should trigger diagnostic if uncommented)
; (sde:hide-region "R.NonExistent")

;; string-append region definition
(sdegeo:create-rectangle
    (position 2.0 0.0 0.0)
    (position 4.0 0.5 0.1)
    "Silicon"
    (string-append "R." "Channel")
)

;; Reference to string-append defined region (should not trigger diagnostic)
; (sde:hide-region "R.Channel")

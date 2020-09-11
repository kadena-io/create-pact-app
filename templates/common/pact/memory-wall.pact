(namespace "free")
(module {{contractName}} GOVERNANCE
  "A smart contract to greet the world."

  (defcap GOVERNANCE ()
    "defines who can update the smart contract"
    true
    ; currently anyone can change your smart contract
    ; for added security replace 'true' with a keyset or account or make it immutable
    ;   keyset:
    ;     (enforce-guard (keyset-ref-guard 'YOUR-KEYSET))
    ;   account:
    ;     (enforce-guard (at 'guard (coin.details "YOUR-ACCOUNT-NAME")))
    ;   immutable:
    ;     false
  )

  (defschema memory-schema
    @doc "Schema to store name and blockheight"
    @model [(invariant (!= name ""))]
    name:string
    block-height:integer)

  (deftable memories:{memory-schema})

  (defun here (name:string)
    "Designed for /send calls. Leave your trace on Kadena mainnet!"
    (enforce (!= name "") "Name cannot be empty")
    (write memories name
      { "name"         : name,
        "block-height" : (at "block-height" (chain-data)) }
    )
    (format "{} was here." [name])
  )

  (defun lookup (key:string)
    (read memories key)
  )

  (defun get-all ()
    (map (read memories) (keys memories))
)

)
(create-table memories)

/* __next_internal_action_entry_do_not_use__ {"7f1c36b06e398c97abe5d5d7ae8c672bfddf4e1b91":"$$RSC_SERVER_ACTION_2","7f3128060c414d59f8552e4788b846c0d2b7f74743":"$$RSC_SERVER_CACHE_0"} */ import { registerServerReference } from "private-next-rsc-server-reference";
import { encryptActionBoundArgs, decryptActionBoundArgs } from "private-next-rsc-action-encryption";
import { cache as $$cache__ } from "private-next-rsc-cache-wrapper";
export var $$RSC_SERVER_CACHE_0 = $$cache__("default", "c03128060c414d59f8552e4788b846c0d2b7f74743", async function cache($$ACTION_CLOSURE_BOUND, e) {
    var [$$ACTION_ARG_0, $$ACTION_ARG_1] = await decryptActionBoundArgs("c03128060c414d59f8552e4788b846c0d2b7f74743", $$ACTION_CLOSURE_BOUND);
    const f = $$ACTION_ARG_0 + e;
    return [
        f,
        {
            a: $$ACTION_ARG_1
        }
    ];
});
async function Component({ a }) {
    const b = 1;
    var action = registerServerReference($$RSC_SERVER_ACTION_2, "401c36b06e398c97abe5d5d7ae8c672bfddf4e1b91", null).bind(null, encryptActionBoundArgs("401c36b06e398c97abe5d5d7ae8c672bfddf4e1b91", [
        a,
        b
    ]));
    return <form action={action}>
      <button>Submit</button>
    </form>;
}
var $$RSC_SERVER_REF_1 = registerServerReference($$RSC_SERVER_CACHE_0, "c03128060c414d59f8552e4788b846c0d2b7f74743", null);
export async function $$RSC_SERVER_ACTION_2($$ACTION_CLOSURE_BOUND, c) {
    var [$$ACTION_ARG_0, $$ACTION_ARG_1] = await decryptActionBoundArgs("401c36b06e398c97abe5d5d7ae8c672bfddf4e1b91", $$ACTION_CLOSURE_BOUND);
    const d = $$ACTION_ARG_0 + $$ACTION_ARG_1 + c;
    var cache = $$RSC_SERVER_REF_1.bind(null, encryptActionBoundArgs("c03128060c414d59f8552e4788b846c0d2b7f74743", [
        d,
        $$ACTION_ARG_0
    ]));
    return cache(d);
}

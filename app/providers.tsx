import { headers } from "next/headers";

import { TRPCReactProvider } from "@/trpc/react";
import { Toaster } from "sonner";
import { ModalProvider } from "@/components/modal/provider";

export function Providers({ children }: { children: React.ReactNode }) {
    return (
        <TRPCReactProvider headers={headers()}>
            <Toaster className="dark:hidden" />
            <Toaster theme="dark" className="hidden dark:block" />
            <ModalProvider>{children}</ModalProvider>
        </TRPCReactProvider>
    );
}

/* import { SessionProvider } from "next-auth/react"; */

/* export function Providers({ children }: { children: React.ReactNode }) {
*     return (
*         <SessionProvider>
*                 <Toaster className="dark:hidden" />
*                 <Toaster theme="dark" className="hidden dark:block" />
*                 <ModalProvider>{children}</ModalProvider>
*         </SessionProvider>
*     );
* } */

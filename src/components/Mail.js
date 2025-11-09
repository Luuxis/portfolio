"use client";

import { useRef, useState, useEffect } from "react";
import emailjs from "@emailjs/browser";

export default function ContactMailSection() {
    const formRef = useRef(null);
    const [status, setStatus] = useState(null);

    useEffect(() => {
        const publicKey = process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY;
        if (publicKey) {
            emailjs.init({
                publicKey: process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY,
            });
        } else {
            console.error("EMAILJS_PUBLIC_KEY manquante");
        }
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setStatus("loading");

        try {
            await emailjs.sendForm(
                process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID,
                process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID,
                formRef.current,
            );
            setStatus("success");
            formRef.current.reset();
        } catch (err) {
            console.error(err);
            setStatus("error");
        }
    };

    return (
        <section
            id="mail"
            className="mt-24 p-10 bg-gray-800 rounded-xl w-11/12 md:w-3/4 mx-auto text-center shadow-md"
        >
            <h3 className="text-3xl text-teal-400 font-semibold mb-6">
                Me Contacter par Mail
            </h3>

            <form
                ref={formRef}
                onSubmit={handleSubmit}
                className="flex flex-col gap-4 text-left"
            >
                <div className="flex flex-col gap-2">
                    <label htmlFor="user_name" className="text-gray-200">
                        Nom / Pseudo
                    </label>
                    <input
                        id="user_name"
                        name="user_name"
                        type="text"
                        required
                        className="bg-gray-700 text-white rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-teal-400"
                        placeholder="Luuxis"
                    />
                </div>

                <div className="flex flex-col gap-2">
                    <label htmlFor="user_email" className="text-gray-200">
                        Email
                    </label>
                    <input
                        id="user_email"
                        name="user_email"
                        type="email"
                        required
                        className="bg-gray-700 text-white rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-teal-400"
                        placeholder="ton@email.com"
                    />
                </div>

                <div className="flex flex-col gap-2">
                    <label htmlFor="subject" className="text-gray-200">
                        Sujet
                    </label>
                    <input
                        id="subject"
                        name="subject"
                        type="text"
                        required
                        className="bg-gray-700 text-white rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-teal-400"
                        placeholder="Proposition de projet, question..."
                    />
                </div>

                <div className="flex flex-col gap-2">
                    <label htmlFor="message" className="text-gray-200">
                        Message
                    </label>
                    <textarea
                        id="message"
                        name="message"
                        rows={5}
                        required
                        className="bg-gray-700 text-white rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-teal-400"
                        placeholder="Dis-moi ce dont tu as besoin 👇"
                    />
                </div>

                <button
                    type="submit"
                    disabled={status === "loading"}
                    className="mt-2 bg-teal-500 hover:bg-teal-400 transition text-gray-900 font-semibold rounded-lg py-2"
                >
                    {status === "loading" ? "Envoi..." : "Envoyer"}
                </button>
            </form>

            {status === "success" && (
                <p className="text-green-400 mt-4">Message envoyé ✅</p>
            )}
            {status === "error" && (
                <p className="text-red-400 mt-4">
                    Oups, un problème est arrivé. Réessaie.
                </p>
            )}
        </section>
    );
}

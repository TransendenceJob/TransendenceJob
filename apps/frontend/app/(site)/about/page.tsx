export default function AboutTeam() {
    const teamMembers = [
        { name: "Member 1", role: "Frontend & UI/UX" },
        { name: "Member 2", role: "Backend & WebSockets" },
        { name: "Member 3", role: "Physics Engine & Game Logic" },
        { name: "Member 4", role: "DevOps & Database" },
    ];

    return (
        <div className="max-w-5xl mx-auto py-20 px-6">
            {/* Header Section */}
            <section className="text-center mb-16">
                <h1 className="text-4xl font-black tracking-tight mb-4">The Development Team</h1>
                <p className="text-zinc-500 max-w-2xl mx-auto">
                    We are a group of four students from <strong>42 Wolfsburg</strong>,
                    working together to build a seamless, web-based artillery strategy game for our Transcendence project.
                </p>
            </section>

            {/* Team Grid */}
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
                {teamMembers.map((member, index) => (
                    <div
                        key={index}
                        className="group p-8 rounded-2xl border border-foreground/5 bg-zinc-50 dark:bg-zinc-900/50 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 text-center"
                    >
                        {/* Avatar Placeholder */}
                        <div className="w-24 h-24 bg-zinc-200 dark:bg-zinc-800 rounded-full mx-auto mb-6 flex items-center justify-center group-hover:bg-blue-500 transition-colors duration-300">
                            <span className="text-3xl group-hover:scale-110 transition-transform">👤</span>
                        </div>

                        <h3 className="font-bold text-xl mb-1">{member.name}</h3>
                        <p className="text-sm text-blue-500 font-medium uppercase tracking-wider">{member.role}</p>
                    </div>
                ))}
            </div>

            {/* Project Vision Section */}
            <section className="mt-24 p-10 rounded-3xl bg-blue-700 text-white shadow-2xl shadow-blue-500/20">
                <h2 className="text-3xl font-black mb-6 text-center tracking-tight">Our Mission</h2>
                <p className="text-blue-50 text-center max-w-3xl mx-auto leading-relaxed text-lg font-medium">
                    The goal of <span className="text-white underline underline-offset-4 decoration-blue-400">Ft_transcendence</span> was
                    to create a high-performance multiplayer experience. From complex projectile physics to real-time
                    synchronization, we focused on delivering a polished game that honors the classics while utilizing
                    modern web technologies.
                </p>
            </section>
        </div>
    );
}
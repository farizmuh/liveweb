<template>
  <!-- 1920x1080 FULL BROADCAST OVERLAY UNTUK OBS TOURNAMENT BRACKET -->
  <div class="w-[1920px] h-[1080px] relative overflow-hidden bg-gradient-to-b from-[#070a12]/95 via-[#0b101d]/90 to-[#030508]/98 border-4 border-amber-500/40 p-6 select-none flex flex-col justify-between">
    
    <!-- Ambient Lightings -->
    <div class="absolute -top-32 left-1/4 w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none"></div>
    <div class="absolute -bottom-32 right-1/4 w-[600px] h-[600px] bg-amber-600/10 rounded-full blur-[120px] pointer-events-none"></div>

    <!-- HEADER TURNAMEN -->
    <header class="w-full flex items-center justify-between pb-3 border-b-2 border-amber-500/40 z-10 shrink-0">
      <div class="flex items-center gap-4">
        <div class="w-13 h-13 rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-300 flex items-center justify-center text-black font-black text-2xl shadow-gold-glow">
          MLBB
        </div>
        <div>
          <div class="flex items-center gap-2">
            <span class="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-400 font-black text-xs uppercase tracking-widest shadow">
              {{ tournament?.type === 'DOUBLE_ELIMINATION' ? 'DOUBLE ELIMINATION' : 'SINGLE ELIMINATION' }}
            </span>
            <span class="px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-bold text-xs uppercase">
              SERIES {{ tournament?.format || 'BO3' }}
            </span>
            <span class="px-2.5 py-0.5 rounded font-black text-xs uppercase tracking-wider shadow" :class="phaseBadgeClass">
              {{ currentPhaseName }}
            </span>
          </div>
          <h1 class="text-2xl font-black uppercase tracking-wider text-white font-display mt-0.5">
            {{ tournament?.name || 'BAGAN TURNAMEN RESMI' }}
          </h1>
        </div>
      </div>

      <!-- OBS LIVE STAGE BADGE (Bersih untuk siaran resmi tanpa tombol klik) -->
      <div class="px-4 py-2 rounded-xl bg-black/60 border border-amber-500/40 flex items-center gap-2 shadow-gold-glow">
        <Trophy class="w-4 h-4 text-amber-400 animate-bounce" />
        <span class="text-xs font-black text-amber-300 uppercase tracking-widest">OBS LIVE STAGE</span>
      </div>
    </header>

    <!-- ============================================================== -->
    <!-- CONTENT AREA DENGAN TRANSISI HALUS (SMOOTH FADE IN/OUT)        -->
    <!-- ============================================================== -->
    <Transition name="stage-fade" mode="out-in">
      
      <!-- MODE 1: FOKUS BABAK 1 (ROUND 1 - 3 KOLOM GRID UNTUK 57 TIM / SS 2) -->
      <main
        v-if="effectiveView === 'round1'"
        key="round1-view"
        class="w-full flex-1 flex flex-col py-2 z-10 overflow-hidden justify-between"
      >
        <!-- Sub-header keterangan -->
        <div class="flex items-center justify-between pb-1 text-xs">
          <div class="flex items-center gap-2">
            <span class="px-2.5 py-0.5 rounded-md bg-amber-500 text-black font-black text-[11px] uppercase tracking-wider shadow">
              FASE PENYISIHAN (ROUND 1)
            </span>
            <span class="text-slate-300 font-bold">
              Total {{ round1Matches.length }} Pertandingan ({{ round1Matches.length * 2 }} Tim Bertanding) &bull; {{ completedR1Count }}/{{ round1Matches.length }} Selesai
            </span>
          </div>
          <div class="flex items-center gap-2 text-slate-400 text-[11px]">
            <span class="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
            <span>Otomatis Beralih ke Babak Utama Setelah Semua Match Selesai</span>
          </div>
        </div>

        <!-- GRID 3 KOLOM UTAMA -->
        <div class="grid grid-cols-3 gap-3 flex-1 overflow-hidden">
          
          <!-- KOLOM 1: Match 1 - 9 -->
          <div class="flex flex-col justify-between gap-1 overflow-hidden">
            <div
              v-for="m in round1Col1"
              :key="m.id"
              class="rounded-lg border bg-slate-950/80 px-2 py-1 flex flex-col justify-center transition shadow"
              :class="[
                m.status === 'LIVE' ? 'border-amber-400 bg-amber-950/20 shadow-gold-glow' : 'border-slate-800'
              ]"
            >
              <div class="flex items-center justify-between text-[9px] font-bold text-slate-400 pb-0.5">
                <span class="uppercase tracking-wider text-amber-400">MATCH #{{ m.matchOrder }}</span>
                <span v-if="m.status === 'LIVE'" class="text-red-400 uppercase tracking-wider flex items-center gap-1 font-black">
                  <span class="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping"></span> LIVE {{ m.assignedCourt }}
                </span>
                <span v-else class="text-slate-500 uppercase">{{ m.status }}</span>
              </div>

              <!-- Team A -->
              <div class="flex items-center justify-between py-0.5 text-xs">
                <div class="flex items-center gap-1.5 overflow-hidden">
                  <span class="w-4 text-[9px] font-black text-amber-400 shrink-0">{{ m.teamAShort?.slice(0, 3) || '?' }}</span>
                  <div class="truncate max-w-[155px]">
                    <span class="font-bold text-white truncate block leading-tight" :class="m.winnerTeam === 'A' ? 'text-amber-300 font-black' : ''">
                      {{ m.teamAName || 'TBD' }}
                    </span>
                    <span v-if="m.teamA?.institution || m.teamAInstitution" class="text-[8px] text-cyan-300 font-medium truncate block leading-none">
                      {{ m.teamA?.institution || m.teamAInstitution }}
                    </span>
                  </div>
                </div>
                <span class="font-display font-black text-xs" :class="m.winnerTeam === 'A' ? 'text-amber-300' : 'text-slate-400'">
                  {{ m.scoreA }}
                </span>
              </div>

              <!-- Team B -->
              <div class="flex items-center justify-between py-0.5 text-xs border-t border-slate-900">
                <div class="flex items-center gap-1.5 overflow-hidden">
                  <span class="w-4 text-[9px] font-black text-amber-400 shrink-0">{{ m.teamBShort?.slice(0, 3) || '?' }}</span>
                  <div class="truncate max-w-[155px]">
                    <span class="font-bold text-white truncate block leading-tight" :class="m.winnerTeam === 'B' ? 'text-amber-300 font-black' : ''">
                      {{ m.teamBName || 'TBD' }}
                    </span>
                    <span v-if="m.teamB?.institution || m.teamBInstitution" class="text-[8px] text-cyan-300 font-medium truncate block leading-none">
                      {{ m.teamB?.institution || m.teamBInstitution }}
                    </span>
                  </div>
                </div>
                <span class="font-display font-black text-xs" :class="m.winnerTeam === 'B' ? 'text-amber-300' : 'text-slate-400'">
                  {{ m.scoreB }}
                </span>
              </div>
            </div>
          </div>

          <!-- KOLOM 2: Match 10 - 17 -->
          <div class="flex flex-col justify-between gap-1 overflow-hidden">
            <div
              v-for="m in round1Col2"
              :key="m.id"
              class="rounded-lg border bg-slate-950/80 px-2 py-1 flex flex-col justify-center transition shadow"
              :class="[
                m.status === 'LIVE' ? 'border-amber-400 bg-amber-950/20 shadow-gold-glow' : 'border-slate-800'
              ]"
            >
              <div class="flex items-center justify-between text-[9px] font-bold text-slate-400 pb-0.5">
                <span class="uppercase tracking-wider text-amber-400">MATCH #{{ m.matchOrder }}</span>
                <span v-if="m.status === 'LIVE'" class="text-red-400 uppercase tracking-wider flex items-center gap-1 font-black">
                  <span class="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping"></span> LIVE {{ m.assignedCourt }}
                </span>
                <span v-else class="text-slate-500 uppercase">{{ m.status }}</span>
              </div>

              <!-- Team A -->
              <div class="flex items-center justify-between py-0.5 text-xs">
                <div class="flex items-center gap-1.5 overflow-hidden">
                  <span class="w-4 text-[9px] font-black text-amber-400 shrink-0">{{ m.teamAShort?.slice(0, 3) || '?' }}</span>
                  <div class="truncate max-w-[155px]">
                    <span class="font-bold text-white truncate block leading-tight" :class="m.winnerTeam === 'A' ? 'text-amber-300 font-black' : ''">
                      {{ m.teamAName || 'TBD' }}
                    </span>
                    <span v-if="m.teamA?.institution || m.teamAInstitution" class="text-[8px] text-cyan-300 font-medium truncate block leading-none">
                      {{ m.teamA?.institution || m.teamAInstitution }}
                    </span>
                  </div>
                </div>
                <span class="font-display font-black text-xs" :class="m.winnerTeam === 'A' ? 'text-amber-300' : 'text-slate-400'">
                  {{ m.scoreA }}
                </span>
              </div>

              <!-- Team B -->
              <div class="flex items-center justify-between py-0.5 text-xs border-t border-slate-900">
                <div class="flex items-center gap-1.5 overflow-hidden">
                  <span class="w-4 text-[9px] font-black text-amber-400 shrink-0">{{ m.teamBShort?.slice(0, 3) || '?' }}</span>
                  <div class="truncate max-w-[155px]">
                    <span class="font-bold text-white truncate block leading-tight" :class="m.winnerTeam === 'B' ? 'text-amber-300 font-black' : ''">
                      {{ m.teamBName || 'TBD' }}
                    </span>
                    <span v-if="m.teamB?.institution || m.teamBInstitution" class="text-[8px] text-cyan-300 font-medium truncate block leading-none">
                      {{ m.teamB?.institution || m.teamBInstitution }}
                    </span>
                  </div>
                </div>
                <span class="font-display font-black text-xs" :class="m.winnerTeam === 'B' ? 'text-amber-300' : 'text-slate-400'">
                  {{ m.scoreB }}
                </span>
              </div>
            </div>
          </div>

          <!-- KOLOM 3: Match 18 - 25 & PANEL TIM UNGGULAN -->
          <div class="flex flex-col justify-between gap-1 overflow-hidden">
            <div
              v-for="m in round1Col3"
              :key="m.id"
              class="rounded-lg border bg-slate-950/80 px-2 py-1 flex flex-col justify-center transition shadow"
              :class="[
                m.status === 'LIVE' ? 'border-amber-400 bg-amber-950/20 shadow-gold-glow' : 'border-slate-800'
              ]"
            >
              <div class="flex items-center justify-between text-[9px] font-bold text-slate-400 pb-0.5">
                <span class="uppercase tracking-wider text-amber-400">MATCH #{{ m.matchOrder }}</span>
                <span v-if="m.status === 'LIVE'" class="text-red-400 uppercase tracking-wider flex items-center gap-1 font-black">
                  <span class="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping"></span> LIVE {{ m.assignedCourt }}
                </span>
                <span v-else class="text-slate-500 uppercase">{{ m.status }}</span>
              </div>

              <!-- Team A -->
              <div class="flex items-center justify-between py-0.5 text-xs">
                <div class="flex items-center gap-1.5 overflow-hidden">
                  <span class="w-4 text-[9px] font-black text-amber-400 shrink-0">{{ m.teamAShort?.slice(0, 3) || '?' }}</span>
                  <div class="truncate max-w-[155px]">
                    <span class="font-bold text-white truncate block leading-tight" :class="m.winnerTeam === 'A' ? 'text-amber-300 font-black' : ''">
                      {{ m.teamAName || 'TBD' }}
                    </span>
                    <span v-if="m.teamA?.institution || m.teamAInstitution" class="text-[8px] text-cyan-300 font-medium truncate block leading-none">
                      {{ m.teamA?.institution || m.teamAInstitution }}
                    </span>
                  </div>
                </div>
                <span class="font-display font-black text-xs" :class="m.winnerTeam === 'A' ? 'text-amber-300' : 'text-slate-400'">
                  {{ m.scoreA }}
                </span>
              </div>

              <!-- Team B -->
              <div class="flex items-center justify-between py-0.5 text-xs border-t border-slate-900">
                <div class="flex items-center gap-1.5 overflow-hidden">
                  <span class="w-4 text-[9px] font-black text-amber-400 shrink-0">{{ m.teamBShort?.slice(0, 3) || '?' }}</span>
                  <div class="truncate max-w-[155px]">
                    <span class="font-bold text-white truncate block leading-tight" :class="m.winnerTeam === 'B' ? 'text-amber-300 font-black' : ''">
                      {{ m.teamBName || 'TBD' }}
                    </span>
                    <span v-if="m.teamB?.institution || m.teamBInstitution" class="text-[8px] text-cyan-300 font-medium truncate block leading-none">
                      {{ m.teamB?.institution || m.teamBInstitution }}
                    </span>
                  </div>
                </div>
                <span class="font-display font-black text-xs" :class="m.winnerTeam === 'B' ? 'text-amber-300' : 'text-slate-400'">
                  {{ m.scoreB }}
                </span>
              </div>
            </div>

            <!-- PANEL KHUSUS: TIM UNGGULAN (DAPAT BYE KE ROUND OF 32) -->
            <div v-if="byeTeamsInR32.length > 0" class="rounded-xl border border-amber-500/50 bg-gradient-to-br from-amber-950/40 via-slate-950 to-slate-950 p-2 shadow-lg mt-1">
              <div class="flex items-center justify-between pb-1 border-b border-amber-500/30">
                <div class="flex items-center gap-1.5">
                  <Crown class="w-3.5 h-3.5 text-amber-400" />
                  <span class="text-[10px] font-black uppercase text-amber-300 tracking-wider">
                    {{ byeTeamsInR32.length }} TIM UNGGULAN (WAITING DI R32)
                  </span>
                </div>
                <span class="px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-400 text-[8px] font-black uppercase">
                  BYE
                </span>
              </div>
              
              <div class="grid grid-cols-2 gap-1 pt-1.5 text-[10px]">
                <div
                  v-for="t in byeTeamsInR32"
                  :key="t.id"
                  class="flex items-center gap-1.5 p-1 rounded-md bg-black/60 border border-slate-800"
                >
                  <div class="w-4 h-4 rounded bg-black flex items-center justify-center shrink-0 border border-slate-700">
                    <span class="text-[7px] font-black text-amber-400">{{ t.shortName?.slice(0, 3) || '?' }}</span>
                  </div>
                  <div class="min-w-0">
                    <span class="font-bold text-slate-200 truncate block leading-tight">{{ t.name }}</span>
                    <span v-if="t.institution" class="text-[8px] text-cyan-400 font-medium truncate block leading-none">{{ t.institution }}</span>
                  </div>
                </div>
              </div>
            </div>

          </div>

        </div>
      </main>

      <!-- MODE 2: GRID ADAPTIF 2 KOLOM (UNTUK ROUND OF 32 & ROUND OF 16) -->
      <main
        v-else-if="effectiveView === 'grid-active'"
        key="grid-active-view"
        class="w-full flex-1 flex flex-col py-2.5 z-10 overflow-hidden justify-between"
      >
        <!-- Sub-header babak aktif -->
        <div class="flex items-center justify-between pb-2 text-xs shrink-0">
          <div class="flex items-center gap-2">
            <span class="px-2.5 py-0.5 rounded-md bg-blue-600 text-white font-black text-[11px] uppercase tracking-wider shadow">
              {{ currentGridRound?.name || 'BABAK UTAMA' }}
            </span>
            <span class="text-slate-300 font-bold">
              Total {{ currentGridRound?.matches.length || 0 }} Pertandingan &bull; {{ completedGridCount }}/{{ currentGridRound?.matches.length || 0 }} Selesai
            </span>
          </div>
          <div class="flex items-center gap-2 text-slate-400 text-[11px]">
            <span class="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
            <span>Otomatis Beralih ke Babak Berikutnya Setelah Semua Match Selesai</span>
          </div>
        </div>

        <!-- 2 KOLOM LUAS (PAS DI LAYAR 1080P TANPA SCROLLBAR) -->
        <div class="grid grid-cols-2 gap-5 flex-1 overflow-hidden py-1">
          
          <!-- KOLOM 1 -->
          <div class="flex flex-col justify-between gap-2 overflow-hidden h-full">
            <div
              v-for="m in gridActiveCol1"
              :key="m.id"
              class="rounded-xl border bg-slate-950/80 px-4 py-2 flex flex-col justify-between transition shadow-md relative overflow-hidden"
              :class="[
                m.status === 'LIVE' ? 'border-2 border-amber-400 bg-amber-950/30 shadow-gold-glow scale-[1.01]' : 'border-slate-800 hover:border-slate-700'
              ]"
            >
              <!-- Baris Atas Info Match -->
              <div class="flex items-center justify-between text-[10px] font-bold text-slate-400 pb-1 border-b border-slate-850">
                <span class="uppercase tracking-wider text-amber-400 font-extrabold">MATCH #{{ m.matchOrder }}</span>
                <span v-if="m.status === 'LIVE'" class="text-red-400 uppercase tracking-widest flex items-center gap-1.5 font-black">
                  <span class="w-2 h-2 rounded-full bg-red-500 animate-ping"></span>
                  LIVE DI {{ m.assignedCourt || 'COURT' }}
                </span>
                <span v-else-if="m.status === 'COMPLETED'" class="text-emerald-400 uppercase tracking-wider font-semibold">SELESAI</span>
                <span v-else class="text-slate-500 uppercase">{{ m.status }}</span>
              </div>

              <!-- Team A -->
              <div class="flex items-center justify-between py-1 text-xs">
                <div class="flex items-center gap-2.5 overflow-hidden min-w-0 flex-1 pr-2">
                  <div class="w-6 h-6 rounded bg-black/70 border border-slate-700 p-0.5 flex items-center justify-center shrink-0">
                    <img v-if="m.teamALogo" :src="m.teamALogo" class="w-full h-full object-contain" />
                    <span v-else class="text-[9px] font-black text-amber-400">{{ m.teamAShort?.slice(0, 3) || '?' }}</span>
                  </div>
                  <div class="truncate flex-1">
                    <span class="font-bold text-white truncate block leading-tight text-sm" :class="m.winnerTeam === 'A' ? 'text-amber-300 font-black' : ''">
                      {{ m.teamAName || (m.isBye ? 'BYE' : 'TBD') }}
                    </span>
                    <span v-if="m.teamA?.institution || m.teamAInstitution" class="text-[9px] text-cyan-300 font-medium truncate block leading-none mt-0.5">
                      {{ m.teamA?.institution || m.teamAInstitution }}
                    </span>
                  </div>
                </div>
                <span class="font-display font-black text-base text-right shrink-0 w-8" :class="m.winnerTeam === 'A' ? 'text-amber-300 drop-shadow' : 'text-slate-400'">
                  {{ m.scoreA }}
                </span>
              </div>

              <!-- Team B -->
              <div class="flex items-center justify-between py-1 text-xs border-t border-slate-900">
                <div class="flex items-center gap-2.5 overflow-hidden min-w-0 flex-1 pr-2">
                  <div class="w-6 h-6 rounded bg-black/70 border border-slate-700 p-0.5 flex items-center justify-center shrink-0">
                    <img v-if="m.teamBLogo" :src="m.teamBLogo" class="w-full h-full object-contain" />
                    <span v-else class="text-[9px] font-black text-amber-400">{{ m.teamBShort?.slice(0, 3) || '?' }}</span>
                  </div>
                  <div class="truncate flex-1">
                    <span class="font-bold text-white truncate block leading-tight text-sm" :class="m.winnerTeam === 'B' ? 'text-amber-300 font-black' : ''">
                      {{ m.teamBName || (m.isBye ? 'BYE' : 'TBD') }}
                    </span>
                    <span v-if="m.teamB?.institution || m.teamBInstitution" class="text-[9px] text-cyan-300 font-medium truncate block leading-none mt-0.5">
                      {{ m.teamB?.institution || m.teamBInstitution }}
                    </span>
                  </div>
                </div>
                <span class="font-display font-black text-base text-right shrink-0 w-8" :class="m.winnerTeam === 'B' ? 'text-amber-300 drop-shadow' : 'text-slate-400'">
                  {{ m.scoreB }}
                </span>
              </div>
            </div>
          </div>

          <!-- KOLOM 2 -->
          <div class="flex flex-col justify-between gap-2 overflow-hidden h-full">
            <div
              v-for="m in gridActiveCol2"
              :key="m.id"
              class="rounded-xl border bg-slate-950/80 px-4 py-2 flex flex-col justify-between transition shadow-md relative overflow-hidden"
              :class="[
                m.status === 'LIVE' ? 'border-2 border-amber-400 bg-amber-950/30 shadow-gold-glow scale-[1.01]' : 'border-slate-800 hover:border-slate-700'
              ]"
            >
              <!-- Baris Atas Info Match -->
              <div class="flex items-center justify-between text-[10px] font-bold text-slate-400 pb-1 border-b border-slate-850">
                <span class="uppercase tracking-wider text-amber-400 font-extrabold">MATCH #{{ m.matchOrder }}</span>
                <span v-if="m.status === 'LIVE'" class="text-red-400 uppercase tracking-widest flex items-center gap-1.5 font-black">
                  <span class="w-2 h-2 rounded-full bg-red-500 animate-ping"></span>
                  LIVE DI {{ m.assignedCourt || 'COURT' }}
                </span>
                <span v-else-if="m.status === 'COMPLETED'" class="text-emerald-400 uppercase tracking-wider font-semibold">SELESAI</span>
                <span v-else class="text-slate-500 uppercase">{{ m.status }}</span>
              </div>

              <!-- Team A -->
              <div class="flex items-center justify-between py-1 text-xs">
                <div class="flex items-center gap-2.5 overflow-hidden min-w-0 flex-1 pr-2">
                  <div class="w-6 h-6 rounded bg-black/70 border border-slate-700 p-0.5 flex items-center justify-center shrink-0">
                    <img v-if="m.teamALogo" :src="m.teamALogo" class="w-full h-full object-contain" />
                    <span v-else class="text-[9px] font-black text-amber-400">{{ m.teamAShort?.slice(0, 3) || '?' }}</span>
                  </div>
                  <div class="truncate flex-1">
                    <span class="font-bold text-white truncate block leading-tight text-sm" :class="m.winnerTeam === 'A' ? 'text-amber-300 font-black' : ''">
                      {{ m.teamAName || (m.isBye ? 'BYE' : 'TBD') }}
                    </span>
                    <span v-if="m.teamA?.institution || m.teamAInstitution" class="text-[9px] text-cyan-300 font-medium truncate block leading-none mt-0.5">
                      {{ m.teamA?.institution || m.teamAInstitution }}
                    </span>
                  </div>
                </div>
                <span class="font-display font-black text-base text-right shrink-0 w-8" :class="m.winnerTeam === 'A' ? 'text-amber-300 drop-shadow' : 'text-slate-400'">
                  {{ m.scoreA }}
                </span>
              </div>

              <!-- Team B -->
              <div class="flex items-center justify-between py-1 text-xs border-t border-slate-900">
                <div class="flex items-center gap-2.5 overflow-hidden min-w-0 flex-1 pr-2">
                  <div class="w-6 h-6 rounded bg-black/70 border border-slate-700 p-0.5 flex items-center justify-center shrink-0">
                    <img v-if="m.teamBLogo" :src="m.teamBLogo" class="w-full h-full object-contain" />
                    <span v-else class="text-[9px] font-black text-amber-400">{{ m.teamBShort?.slice(0, 3) || '?' }}</span>
                  </div>
                  <div class="truncate flex-1">
                    <span class="font-bold text-white truncate block leading-tight text-sm" :class="m.winnerTeam === 'B' ? 'text-amber-300 font-black' : ''">
                      {{ m.teamBName || (m.isBye ? 'BYE' : 'TBD') }}
                    </span>
                    <span v-if="m.teamB?.institution || m.teamBInstitution" class="text-[9px] text-cyan-300 font-medium truncate block leading-none mt-0.5">
                      {{ m.teamB?.institution || m.teamBInstitution }}
                    </span>
                  </div>
                </div>
                <span class="font-display font-black text-base text-right shrink-0 w-8" :class="m.winnerTeam === 'B' ? 'text-amber-300 drop-shadow' : 'text-slate-400'">
                  {{ m.scoreB }}
                </span>
              </div>
            </div>
          </div>

        </div>
      </main>

      <!-- MODE 3: PLAYOFFS VIEW (FOKUS 8 BESAR - QUARTERFINALS, SEMIS, FINALS / SS 3) -->
      <main
        v-else-if="effectiveView === 'playoffs'"
        key="playoffs-view"
        class="w-full flex-1 flex flex-col py-3 z-10 overflow-hidden justify-between"
      >
        <!-- Sub-header Playoff -->
        <div class="flex items-center justify-between pb-2 text-xs shrink-0">
          <div class="flex items-center gap-2">
            <span class="px-2.5 py-0.5 rounded-md bg-gradient-to-r from-amber-500 to-amber-300 text-black font-black text-[11px] uppercase tracking-wider shadow-gold-glow">
              🏆 FASE PLAYOFFS (8 BESAR MENUJU JUARA)
            </span>
            <span class="text-slate-300 font-bold">
              Pertarungan Puncak Juara &bull; Quarterfinals &bull; Semifinals &bull; Grand Finals
            </span>
          </div>
          <div class="flex items-center gap-2 text-amber-400 font-bold text-xs">
            <Trophy class="w-4 h-4 animate-bounce" />
            <span>ROAD TO CHAMPION</span>
          </div>
        </div>

        <!-- 3 KOLOM BESAR & GAGAH (QF -> SF -> GF) -->
        <div class="flex-1 flex items-stretch justify-around gap-8 overflow-hidden py-2">
          <div
            v-for="roundObj in playoffsRounds"
            :key="roundObj.round"
            class="flex-1 flex flex-col h-full justify-between max-w-[500px]"
          >
            <!-- Header Babak -->
            <div class="text-center pb-2 shrink-0">
              <span class="px-4 py-1.5 rounded-xl bg-slate-900 border border-amber-500/60 text-amber-300 font-black text-sm uppercase tracking-widest shadow-gold-glow inline-block">
                {{ roundObj.name }}
              </span>
            </div>

            <!-- Matches -->
            <div class="flex-1 flex flex-col justify-around py-2 gap-4">
              <div
                v-for="m in roundObj.matches"
                :key="m.id"
                class="rounded-2xl metallic-card border transition-all duration-300 shadow-2xl overflow-hidden relative"
                :class="[
                  m.status === 'LIVE' ? 'border-2 border-amber-400 shadow-gold-glow scale-[1.02]' : 'border-slate-700/80'
                ]"
              >
                <!-- Live Banner -->
                <div
                  v-if="m.status === 'LIVE'"
                  class="w-full bg-red-600 text-white text-[11px] font-black uppercase tracking-widest text-center py-1 flex items-center justify-center gap-2 shadow"
                >
                  <span class="w-2 h-2 rounded-full bg-white animate-ping"></span>
                  <span>LIVE DI {{ m.assignedCourt || 'COURT' }}</span>
                </div>

                <!-- Team A Row -->
                <div
                  class="flex items-center justify-between p-3.5 transition-colors border-b border-slate-800"
                  :class="[
                    m.winnerTeam === 'A' ? 'bg-amber-500/20 font-bold' : 'bg-slate-950/70',
                    !m.teamAId ? 'opacity-40' : ''
                  ]"
                >
                  <div class="flex items-center gap-3 overflow-hidden min-w-0 flex-1 pr-2">
                    <div class="w-9 h-9 rounded-xl bg-black/80 border border-slate-700 p-1 flex items-center justify-center shrink-0">
                      <img v-if="m.teamALogo" :src="m.teamALogo" class="w-full h-full object-contain" />
                      <span v-else class="text-xs font-black text-amber-400">{{ m.teamAShort?.slice(0, 3) || '?' }}</span>
                    </div>
                    <div class="min-w-0 flex-1">
                      <span class="text-base font-black uppercase text-white truncate block max-w-[240px]">
                        {{ m.teamAName || (m.isBye ? 'BYE' : 'TBD') }}
                      </span>
                      <span v-if="m.teamA?.institution || m.teamAInstitution" class="text-[10px] text-cyan-300 font-semibold truncate block leading-none mt-0.5">
                        {{ m.teamA?.institution || m.teamAInstitution }}
                      </span>
                    </div>
                  </div>
                  <div
                    class="w-10 text-center font-display text-2xl font-black text-white shrink-0"
                    :class="m.winnerTeam === 'A' ? 'text-amber-300 drop-shadow' : 'text-slate-400'"
                  >
                    {{ m.scoreA }}
                  </div>
                </div>

                <!-- Team B Row -->
                <div
                  class="flex items-center justify-between p-3.5 transition-colors"
                  :class="[
                    m.winnerTeam === 'B' ? 'bg-amber-500/20 font-bold' : 'bg-slate-950/70',
                    !m.teamBId ? 'opacity-40' : ''
                  ]"
                >
                  <div class="flex items-center gap-3 overflow-hidden min-w-0 flex-1 pr-2">
                    <div class="w-9 h-9 rounded-xl bg-black/80 border border-slate-700 p-1 flex items-center justify-center shrink-0">
                      <img v-if="m.teamBLogo" :src="m.teamBLogo" class="w-full h-full object-contain" />
                      <span v-else class="text-xs font-black text-amber-400">{{ m.teamBShort?.slice(0, 3) || '?' }}</span>
                    </div>
                    <div class="min-w-0 flex-1">
                      <span class="text-base font-black uppercase text-white truncate block max-w-[240px]">
                        {{ m.teamBName || (m.isBye ? 'BYE' : 'TBD') }}
                      </span>
                      <span v-if="m.teamB?.institution || m.teamBInstitution" class="text-[10px] text-cyan-300 font-semibold truncate block leading-none mt-0.5">
                        {{ m.teamB?.institution || m.teamBInstitution }}
                      </span>
                    </div>
                  </div>
                  <div
                    class="w-10 text-center font-display text-2xl font-black text-white shrink-0"
                    :class="m.winnerTeam === 'B' ? 'text-amber-300 drop-shadow' : 'text-slate-400'"
                  >
                    {{ m.scoreB }}
                  </div>
                </div>

              </div>
            </div>
          </div>
        </div>
      </main>

    </Transition>

    <!-- FOOTER INFO & TICKER PARTICIPATING TEAMS -->
    <footer class="w-full flex items-center justify-between pt-2.5 border-t-2 border-amber-500/40 text-xs text-slate-400 z-10 shrink-0">
      <div class="flex items-center gap-2">
        <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
        <span class="font-bold text-slate-300">LIVE BRACKET SYNC &bull; TOURNAMENT PLATFORM</span>
      </div>

      <!-- RUNNING TICKER 57 TEAMS -->
      <div class="flex-1 max-w-[900px] overflow-hidden whitespace-nowrap px-4 text-[11px] font-bold text-amber-300/80">
        <div class="inline-block animate-marquee">
          <span>PARTICIPATING TEAMS: </span>
          <span v-for="(t, idx) in allTournamentTeams" :key="t.id" class="mx-2 text-slate-300">
            <span class="text-amber-400">[{{ idx + 1 }}]</span> {{ t.name }}
          </span>
        </div>
      </div>

      <div class="font-bold text-amber-400 tracking-wider">
        MOBILE LEGENDS COMMUNITY ESPORTS BROADCAST
      </div>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from "vue";
import { useRoute } from "vue-router";
import { useBracketStore, type BracketMatchNode } from "../stores/useBracketStore";
import { Trophy, Crown } from "lucide-vue-next";

const route = useRoute();
const bracketStore = useBracketStore();

const tournament = computed(() => bracketStore.tournament);

// Group matches by round for bracket
const rounds = computed(() => {
  if (!tournament.value?.matches) return [];

  const map = new Map<number, { round: number; name: string; matches: BracketMatchNode[] }>();

  for (const m of tournament.value.matches) {
    if (!map.has(m.round)) {
      map.set(m.round, {
        round: m.round,
        name: m.roundName,
        matches: [],
      });
    }
    map.get(m.round)!.matches.push(m);
  }

  return Array.from(map.values()).sort((a, b) => a.round - b.round);
});

// Ronde 1 Matches (Play-in)
const round1Matches = computed(() => {
  return tournament.value?.matches?.filter((m) => m.round === 1) || [];
});

// Jumlah match Round 1 yang sudah selesai
const completedR1Count = computed(() => {
  return round1Matches.value.filter((m) => m.status === "COMPLETED").length;
});

// Pembagian 3 Kolom untuk Round 1 (Misal 25 match: Kolom 1 = 9, Kolom 2 = 9, Kolom 3 = 7)
const round1Col1 = computed(() => {
  const matches = round1Matches.value;
  const colSize = Math.ceil(matches.length / 3);
  return matches.slice(0, colSize);
});

const round1Col2 = computed(() => {
  const matches = round1Matches.value;
  const colSize = Math.ceil(matches.length / 3);
  return matches.slice(colSize, colSize * 2);
});

const round1Col3 = computed(() => {
  const matches = round1Matches.value;
  const colSize = Math.ceil(matches.length / 3);
  return matches.slice(colSize * 2);
});

// Tim-tim yang langsung menunggu di Round of 32 (BYE di Round 1)
const byeTeamsInR32 = computed(() => {
  if (!tournament.value?.matches) return [];
  const r2Matches = tournament.value.matches.filter((m) => m.round === 2);
  const byes: { id: string; name: string; shortName: string; institution?: string | null }[] = [];

  for (const m of r2Matches) {
    if (m.teamAId && m.teamAName) {
      const isFromR1 = round1Matches.value.some((r1) => r1.nextMatchId === m.id && r1.nextMatchSlot === "A");
      if (!isFromR1) {
        byes.push({
          id: m.teamAId,
          name: m.teamAName,
          shortName: m.teamAShort || "",
          institution: m.teamA?.institution || m.teamAInstitution || null,
        });
      }
    }
    if (m.teamBId && m.teamBName) {
      const isFromR1 = round1Matches.value.some((r1) => r1.nextMatchId === m.id && r1.nextMatchSlot === "B");
      if (!isFromR1) {
        byes.push({
          id: m.teamBId,
          name: m.teamBName,
          shortName: m.teamBShort || "",
          institution: m.teamB?.institution || m.teamBInstitution || null,
        });
      }
    }
  }

  return byes;
});

// Ronde aktif sebelum Quarterfinals (Round of 32 atau Round of 16)
const currentGridRound = computed(() => {
  if (!tournament.value?.matches || rounds.value.length === 0) return null;

  const qfRound = rounds.value.find(
    (r) => r.name.toLowerCase().includes("quarterfinal") || (rounds.value.length >= 3 && r.round === rounds.value.length - 2)
  );

  if (rounds.value.length <= 3) return null;

  const preQfRounds = qfRound ? rounds.value.filter((r) => r.round < qfRound.round) : rounds.value.slice(0, -3);

  // Cari ronde terawal yang BELUM 100% selesai (skip Round 1 jika R1 ditangani view khusus)
  const nonR1PreQf = preQfRounds.filter((r) => r.round > 1);
  const active = nonR1PreQf.find((r) => r.matches.some((m) => m.status !== "COMPLETED"));
  return active || nonR1PreQf[nonR1PreQf.length - 1] || null;
});

// Jumlah match yang selesai di ronde grid aktif
const completedGridCount = computed(() => {
  if (!currentGridRound.value) return 0;
  return currentGridRound.value.matches.filter((m) => m.status === "COMPLETED").length;
});

// Pembagian 2 Kolom Luas untuk currentGridRound
const gridActiveCol1 = computed(() => {
  if (!currentGridRound.value) return [];
  const matches = currentGridRound.value.matches;
  const half = Math.ceil(matches.length / 2);
  return matches.slice(0, half);
});

const gridActiveCol2 = computed(() => {
  if (!currentGridRound.value) return [];
  const matches = currentGridRound.value.matches;
  const half = Math.ceil(matches.length / 2);
  return matches.slice(half);
});

// Seluruh tim peserta turnamen untuk running ticker di footer
const allTournamentTeams = computed(() => {
  if (!tournament.value?.matches) return [];
  const map = new Map<string, { id: string; name: string }>();

  for (const m of tournament.value.matches) {
    if (m.teamAId && m.teamAName && m.teamAName !== "BYE") {
      map.set(m.teamAId, { id: m.teamAId, name: m.teamAName });
    }
    if (m.teamBId && m.teamBName && m.teamBName !== "BYE") {
      map.set(m.teamBId, { id: m.teamBId, name: m.teamBName });
    }
  }

  return Array.from(map.values());
});

// 3 Ronde Terakhir untuk Babak 8 Besar / Playoffs (Quarterfinals -> Semifinals -> Grand Finals)
const playoffsRounds = computed(() => {
  if (rounds.value.length <= 3) return rounds.value;
  return rounds.value.slice(-3);
});

// ==============================================================
// 🧠 LOGIKA PINTAR OTOMATIS (SMART STAGE DETECTION):
// 1. Round 1 belum 100% selesai -> Tampilkan SS 2 (3 Kolom Grid untuk 25 match R1)
// 2. Round 1 selesai, masuk R32 / R16 -> Tampilkan 2 Kolom Luas per ronde aktif tanpa scrollbar
// 3. Masuk Quarterfinals (8 Besar) -> Otomatis beralih ke SS 3 (Playoffs)
// ==============================================================
const smartAutoView = computed<"round1" | "grid-active" | "playoffs">(() => {
  const matches = tournament.value?.matches || [];
  if (matches.length === 0) return "playoffs";

  // Turnamen kecil (<= 3 ronde) langsung ke playoffs
  if (rounds.value.length <= 3) {
    return "playoffs";
  }

  const qfRound = rounds.value.find(
    (r) => r.name.toLowerCase().includes("quarterfinal") || (rounds.value.length >= 3 && r.round === rounds.value.length - 2)
  );

  if (qfRound) {
    // Cek apakah SEMUA babak sebelum Quarterfinals sudah 100% selesai
    const preQfMatches = matches.filter((m) => m.round < qfRound.round);
    const allPreQfDone = preQfMatches.length > 0 && preQfMatches.every((m) => m.status === "COMPLETED");

    if (allPreQfDone) {
      return "playoffs"; // SS 3
    }
  }

  // Jika Round 1 masih ada pertandingan yang belum selesai
  const r1 = round1Matches.value;
  const isR1Ongoing = r1.length > 8 && r1.some((m) => m.status !== "COMPLETED");

  if (isR1Ongoing) {
    return "round1"; // SS 2
  }

  // Jika Round 1 sudah 100% selesai, tampilkan babak aktif (R32 atau R16) dalam 2 Kolom Luas
  return "grid-active";
});

// View yang aktif digunakan di layar (URL Query override > Smart Auto)
const effectiveView = computed<"round1" | "grid-active" | "playoffs">(() => {
  const queryView = route.query.view as string;
  if (queryView === "round1" || queryView === "r1") return "round1";
  if (queryView === "playoffs" || queryView === "p") return "playoffs";
  if (queryView === "grid" || queryView === "r32" || queryView === "r16") return "grid-active";
  return smartAutoView.value;
});

// Indikator Fase Turnamen di Header
const currentPhaseName = computed(() => {
  if (effectiveView.value === "round1") {
    return "⚔️ FASE 1: PENYISIHAN (57 TIM)";
  } else if (effectiveView.value === "playoffs") {
    return "🏆 FASE 3: PLAYOFFS (8 BESAR - FINAL)";
  } else {
    const rName = currentGridRound.value?.name ? currentGridRound.value.name.toUpperCase() : "BABAK UTAMA";
    return `⚔️ FASE 2: ${rName}`;
  }
});

const phaseBadgeClass = computed(() => {
  if (effectiveView.value === "round1") {
    return "bg-amber-500/20 text-amber-300 border border-amber-400/50";
  } else if (effectiveView.value === "playoffs") {
    return "bg-gradient-to-r from-amber-500 to-amber-300 text-black font-black shadow-gold-glow";
  } else {
    return "bg-blue-600/30 text-blue-300 border border-blue-400/50";
  }
});

onMounted(async () => {
  await bracketStore.fetchActiveBracket();
  bracketStore.initSocket();
});
</script>

<style scoped>
/* Transisi halus saat beralih fase bagan */
.stage-fade-enter-active,
.stage-fade-leave-active {
  transition: opacity 0.5s ease, transform 0.5s ease;
}

.stage-fade-enter-from {
  opacity: 0;
  transform: scale(0.98);
}

.stage-fade-leave-to {
  opacity: 0;
  transform: scale(1.02);
}

.animate-marquee {
  display: inline-block;
  white-space: nowrap;
  animation: marquee 35s linear infinite;
}

@keyframes marquee {
  0% { transform: translateX(100%); }
  100% { transform: translateX(-100%); }
}
</style>

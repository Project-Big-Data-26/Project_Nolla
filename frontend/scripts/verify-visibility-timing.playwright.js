// Jalankan melalui playwright-cli run-code --filename=... pada attempt aktif.
// Memerlukan browser native/CDP tanpa override fokus. Akun harus akun tester.
// Pretest: menjawab satu soal pemanasan, lalu mengukur soal berikutnya.
// Kuis: mengukur soal 2 yang belum pernah dilihat, lalu submit seluruh kuis.
// oxlint-disable-next-line no-unused-expressions -- playwright-cli evaluates this function literal.
async page => {
  page.setDefaultTimeout(15000);
  const mode = new URL(page.url()).searchParams.get("mode");
  if (!["pretest", "quiz"].includes(mode)) throw new Error("Buka halaman pengerjaan tester terlebih dahulu");
  const context = page.context();
  const session = await context.newCDPSession(page);
  await session.send("Emulation.setFocusEmulationEnabled", { enabled: false });
  const other = await context.newPage();
  const otherSession = await context.newCDPSession(other);
  await otherSession.send("Emulation.setFocusEmulationEnabled", { enabled: false });
  await page.bringToFront();
  await page.waitForFunction(() => document.visibilityState === "visible");

  const chooseB = () => page.locator("main button").filter({ hasText: /^B/ }).press("Enter");
  const pickTiming = answer => ({ question_id: answer.question_id, response_time_ms: answer.response_time_ms, response_time_partial: answer.response_time_partial });
  let attemptId, questionId, sequence;
  try {
    if (mode === "pretest") {
      await chooseB();
      const answered = page.waitForResponse(response => /\/api\/pretest\/[^/]+\/answer$/.test(new URL(response.url()).pathname));
      await page.getByRole("button", { name: "Selanjutnya", exact: true }).press("Enter");
      const response = await answered;
      if (response.status() !== 200) throw new Error("Jawaban pemanasan gagal");
      const data = (await response.json()).data;
      attemptId = new URL(response.url()).pathname.split("/")[3];
      questionId = data.next_question?.question_id;
      sequence = data.next_question_sequence;
      if (!questionId || !sequence) throw new Error("Tidak ada soal baru untuk diukur");
      await page.waitForFunction(({ key, id }) => JSON.parse(sessionStorage.getItem(key) || "{}").open === id,
        { key: `pretest:${attemptId}:timing`, id: questionId });
    } else {
      const keys = await page.evaluate(() => Object.keys(sessionStorage).filter(key => /^quiz:[a-f0-9]{24}$/.test(key)));
      if (keys.length !== 1) throw new Error("Sesi kuis aktif harus tunggal pada tab pengujian");
      attemptId = keys[0].split(":")[1];
      sequence = 2;
      await page.getByRole("button", { name: /^Soal 2(?:,|$)/ }).press("Enter");
      questionId = await page.evaluate(key => JSON.parse(sessionStorage.getItem(key) || "{}").open, `${keys[0]}:timing`);
      if (!questionId) throw new Error("Timer soal kuis belum aktif");
    }

    await page.evaluate(() => {
      const observation = { startMs: performance.now(), initialState: document.visibilityState, transitions: [] };
      observation.listener = event => observation.transitions.push({ state: document.visibilityState, atMs: performance.now(), trusted: event.isTrusted });
      document.addEventListener("visibilitychange", observation.listener);
      window.__nollaVisibilityTiming = observation;
    });
    await chooseB();
    await page.waitForTimeout(5000);
    await other.bringToFront();
    await page.waitForFunction(() => document.visibilityState === "hidden");
    await page.waitForTimeout(10000);
    await page.bringToFront();
    await page.waitForFunction(() => document.visibilityState === "visible");
    await page.waitForTimeout(3000);

    const observation = await page.evaluate(() => {
      const value = window.__nollaVisibilityTiming;
      document.removeEventListener("visibilitychange", value.listener);
      const endMs = performance.now();
      let state = value.initialState, previous = value.startMs, visibleMs = 0, hiddenMs = 0;
      for (const event of [...value.transitions, { atMs: endMs }]) {
        if (state === "visible") visibleMs += event.atMs - previous;
        else hiddenMs += event.atMs - previous;
        previous = event.atMs;
        state = event.state;
      }
      return { initialState: value.initialState, transitions: value.transitions.map(event => ({ ...event, atMs: Math.round(event.atMs - value.startMs) })), visibleMs: Math.round(visibleMs), hiddenMs: Math.round(hiddenMs), wallMs: Math.round(endMs - value.startMs) };
    });

    let payload, responseStatus;
    if (mode === "pretest") {
      const answered = page.waitForResponse(response => /\/api\/pretest\/[^/]+\/answer$/.test(new URL(response.url()).pathname));
      await page.getByRole("button", { name: "Selanjutnya", exact: true }).press("Enter");
      const response = await answered;
      payload = pickTiming(response.request().postDataJSON());
      responseStatus = response.status();
    } else {
      // Tutup segmen soal 2; jangan kunjungi lagi saat mengisi soal sisanya.
      await page.getByRole("button", { name: /^Soal 3(?:,|$)/ }).press("Enter");
    }


    if (mode === "quiz") {
      const numbers = await page.getByRole("button", { name: /^Soal \d+(?:,|$)/ }).count();
      for (let number = 1; number <= numbers; number++) {
        if (number === sequence) continue;
        await page.getByRole("button", { name: new RegExp(`^Soal ${number}(?:,|$)`) }).press("Enter");
        await chooseB();
      }
      const submitted = page.waitForResponse(response => /\/api\/quiz\/[^/]+\/submit$/.test(new URL(response.url()).pathname));
      await page.getByRole("button", { name: "Submit", exact: true }).press("Enter");
      const response = await submitted;
      const request = response.request().postDataJSON();
      payload = { ...pickTiming(request.answers.find(answer => answer.question_id === questionId)), timing_method: request.timing_method };
      responseStatus = response.status();
      await page.waitForURL("**/review-quiz?**");
    }

    const states = [observation.initialState, ...observation.transitions.map(event => event.state)];
    const checks = {
      nativeTransition: JSON.stringify(states) === JSON.stringify(["visible", "hidden", "visible"]) && observation.transitions.every(event => event.trusted),
      visibleNearEightSeconds: Math.abs(observation.visibleMs - 8000) <= 1000,
      hiddenNearTenSeconds: Math.abs(observation.hiddenMs - 10000) <= 1000,
      payloadNearEightSeconds: Math.abs(payload.response_time_ms - 8000) <= 1000,
      payloadMatchesVisible: Math.abs(payload.response_time_ms - observation.visibleMs) <= 1000,
      completeTiming: payload.response_time_partial === false,
      responseAccepted: responseStatus === 200,
      supportedTimingMethod: mode !== "quiz" || payload.timing_method === "client_visible_v1",
    };
    const result = { mode, attemptId, questionId, sequence, testedAt: new Date().toISOString(), requestedMs: { visible: 8000, hidden: 10000 }, observation, payload, responseStatus, checks, passed: Object.values(checks).every(Boolean) };
    await page.evaluate(value => sessionStorage.setItem(`nolla.visibility.${value.mode}`, JSON.stringify(value)), result);
    return result;
  } finally {
    await page.bringToFront();
    await other.close();
  }
}

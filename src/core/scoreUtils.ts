import { Match, Innings, Ball } from '../types';

export function cloneMatch(match: Match): Match {
  return JSON.parse(JSON.stringify(match));
}

// Applies a ball to the innings and returns the new Innings object (mutates the passed clone but returns it)
export function applyBall(innings: Innings, ball: Ball): Innings {
  innings.balls.push(ball);

  // Initialize stats if not present
  if (!innings.batsmen[ball.strikerId]) innings.batsmen[ball.strikerId] = { id: ball.strikerId, name: '', runs: 0, balls: 0, fours: 0, sixes: 0, isOut: false };
  if (!innings.batsmen[ball.nonStrikerId]) innings.batsmen[ball.nonStrikerId] = { id: ball.nonStrikerId, name: '', runs: 0, balls: 0, fours: 0, sixes: 0, isOut: false };
  if (!innings.bowlers[ball.bowlerId]) innings.bowlers[ball.bowlerId] = { id: ball.bowlerId, name: '', balls: 0, runs: 0, wickets: 0, maidens: 0 };

  const striker = innings.batsmen[ball.strikerId];
  const bowler = innings.bowlers[ball.bowlerId];

  let runsScoredByBat = 0;
  let extrasDeltas = { wide: 0, noBall: 0, bye: 0, legBye: 0 };
  let bowlerRuns = 0;

  if (ball.isWide) {
    extrasDeltas.wide += 1 + ball.runsBase;
    bowlerRuns += 1 + ball.runsBase;
  } else if (ball.isNoBall) {
    extrasDeltas.noBall += 1;
    bowlerRuns += 1;
    if (ball.isBye) { extrasDeltas.bye += ball.runsBase; }
    else if (ball.isLegBye) { extrasDeltas.legBye += ball.runsBase; }
    else {
      runsScoredByBat += ball.runsBase;
      bowlerRuns += ball.runsBase;
    }
  } else {
    // Legal delivery
    if (ball.isBye) { extrasDeltas.bye += ball.runsBase; }
    else if (ball.isLegBye) { extrasDeltas.legBye += ball.runsBase; }
    else {
      runsScoredByBat += ball.runsBase;
      bowlerRuns += ball.runsBase;
    }
  }

  // Update Batsman
  if (!ball.isWide) {
    striker.balls += 1;
  }
  striker.runs += runsScoredByBat;
  if (runsScoredByBat === 4) striker.fours += 1;
  if (runsScoredByBat === 6) striker.sixes += 1;

  // Update Bowler
  if (ball.isLegal) {
    bowler.balls += 1;
  }
  bowler.runs += bowlerRuns;
  if (ball.isWicket && ball.wicketType !== 'RunOut' && ball.wicketType !== 'RetiredHurt') {
    bowler.wickets += 1;
  }

  // Update Innings
  innings.totalRuns += extrasDeltas.wide + extrasDeltas.noBall + extrasDeltas.bye + extrasDeltas.legBye + runsScoredByBat;
  innings.extras.wide += extrasDeltas.wide;
  innings.extras.noBall += extrasDeltas.noBall;
  innings.extras.bye += extrasDeltas.bye;
  innings.extras.legBye += extrasDeltas.legBye;

  if (ball.isLegal) {
    innings.totalBalls += 1;
    innings.oversCompleted = Math.floor(innings.totalBalls / 6);
  }

  if (ball.isWicket) {
    innings.totalWickets += 1;
    striker.isOut = true;
    striker.outType = ball.wicketType;
    striker.outBowlerId = ball.bowlerId;
  }

  // Strike Rotation Logic
  let swapStrike = false;
  // 1, 3 runs bat/bye/legbye causes swap
  if (ball.runsBase % 2 !== 0) swapStrike = true;
  
  if (ball.isLegal && innings.totalBalls % 6 === 0) {
    // End of over
    swapStrike = !swapStrike; // Rotate for over change
  }

  if (swapStrike) {
    const temp = innings.currentStrikerId;
    innings.currentStrikerId = innings.currentNonStrikerId;
    innings.currentNonStrikerId = temp;
  }

  // If wicket fell, current striker becomes null so user can select next
  if (ball.isWicket) {
    if (swapStrike) {
      // If it was a run out on odd runs, who got out?
      // For simplicity, we assume the striker is out unless it's a specific run out on non-striker.
      // If striker is out, we don't swap it yet, just mark current missing.
      // Let's keep it simple: assuming striker is out.
      innings.currentStrikerId = null; 
      // the non-striker moves to non-striker end or striker end depending on swapStrike.
      // If swapStrike was supposed to happen, we put nonStriker in striker position.
      innings.currentStrikerId = innings.currentNonStrikerId;
      innings.currentNonStrikerId = null;
    } else {
      innings.currentStrikerId = null;
    }
  }

  return innings;
}

export function formatOvers(totalBalls: number): string {
  const overs = Math.floor(totalBalls / 6);
  const balls = totalBalls % 6;
  return `${overs}.${balls}`;
}

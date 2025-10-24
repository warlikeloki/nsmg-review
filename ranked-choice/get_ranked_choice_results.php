<?php
header("Content-Type: application/json");

require_once __DIR__ . '/../includes/db.php';

$ballot_id = isset($_GET['ballot']) ? (int)$_GET['ballot'] : 0;
if ($ballot_id <= 0) {
    echo json_encode(["success" => false, "message" => "Invalid ballot ID."]);
    exit;
}

try {
    $pdo = new PDO($dsn, $db_user, $db_pass, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION
    ]);

    // Get candidate list
    $stmt = $pdo->prepare("SELECT candidates FROM ranked_ballots WHERE id = ?");
    $stmt->execute([$ballot_id]);
    $row = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$row) {
        echo json_encode(["success" => false, "message" => "Ballot not found."]);
        exit;
    }

    $candidates = json_decode($row['candidates'], true);
    if (!is_array($candidates) || count($candidates) < 2) {
        echo json_encode(["success" => false, "message" => "Invalid candidate list."]);
        exit;
    }

    // Get all votes
    $stmt = $pdo->prepare("SELECT rankings FROM ranked_votes WHERE ballot_id = ?");
    $stmt->execute([$ballot_id]);
    $votes = [];
    while ($vote = $stmt->fetch(PDO::FETCH_ASSOC)) {
        $ranking = json_decode($vote['rankings'], true);
        if (is_array($ranking)) {
            $votes[] = $ranking;
        }
    }

    if (empty($votes)) {
        echo json_encode(["success" => false, "message" => "No votes found."]);
        exit;
    }

    $rounds = [];
    $active = $candidates;

    while (true) {
        $tally = array_fill_keys($active, 0);

        foreach ($votes as $vote) {
            foreach ($vote as $choice) {
                if (in_array($choice, $active)) {
                    $tally[$choice]++;
                    break;
                }
            }
        }

        $totalVotes = array_sum($tally);
        $majority = floor($totalVotes / 2) + 1;

        $rounds[] = [
            "tally" => $tally,
            "total" => $totalVotes
        ];

        // Check for winner
        foreach ($tally as $candidate => $count) {
            if ($count >= $majority) {
                echo json_encode([
                    "success" => true,
                    "winner" => $candidate,
                    "rounds" => $rounds
                ]);
                exit;
            }
        }

        // Eliminate lowest
        $minVotes = min($tally);
        $toEliminate = array_keys($tally, $minVotes);

        // Break ties randomly or eliminate all tied
        foreach ($toEliminate as $eliminated) {
            $active = array_values(array_diff($active, [$eliminated]));
        }

        if (count($active) === 1) {
            // Last remaining candidate
            echo json_encode([
                "success" => true,
                "winner" => $active[0],
                "rounds" => $rounds
            ]);
            exit;
        }

        if (empty($active)) {
            echo json_encode(["success" => false, "message" => "No winner could be determined."]);
            exit;
        }
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Server error."]);
}

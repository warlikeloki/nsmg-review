<?php
header("Content-Type: application/json");

// TEMPORARY: Simulated pricing data (replace with DB query later)
$pricingData = [
    [
        "service" => "Portrait Session",
        "price" => 150.00,
        "unit" => "flat",
        "category" => "Photography",
        "description" => "1 hour session, 10 edited images",
        "is_package" => false
    ],
    [
        "service" => "Event Videography",
        "price" => 150.00,
        "unit" => "per hour",
        "category" => "Videography",
        "description" => "Live event coverage, raw or edited output",
        "is_package" => false
    ],
    [
        "service" => "Photo + Video Package",
        "price" => 1000.00,
        "unit" => "flat",
        "category" => "Package",
        "description" => "Combined photo & video coverage for 1 event",
        "is_package" => true
    ]
];

// Optional filter by category
$category = isset($_GET['category']) ? strtolower($_GET['category']) : null;

if ($category) {
    $filtered = array_filter($pricingData, function ($item) use ($category) {
        return strtolower($item['category']) === $category;
    });
    echo json_encode(array_values($filtered));
} else {
    echo json_encode($pricingData);
}
?>

<?php
$empfaenger = "maltewellmann@gmail.com";
$absendername = "EVALUATION";
$absendermail = "evaluation@mollebox.de";
$betreff = "EVALUATION";
$text = $_POST["evaluation"];
mail($empfaenger, $betreff, $text, "From: $absendername <$absendermail>");
?>
Ihre Daten wurden übertragen.<br>
Nachdem Sie den Papierteil der Evaluation bearbeitet haben, klicken Sie bitte <a href="https://docs.google.com/forms/d/1KOX2fOK7Semiyro74x2OrYMA70H8lwc3aKDoP2zIKfA/viewform">hier</a>.
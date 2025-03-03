function search() {
  // Declare variables
  var input, filter, ul, li, button, i;
  input = document.getElementById("search");
  filter = input.value.toUpperCase();
  ul = document.getElementById("menu");
  li = ul.getElementsByTagName("li");

  // Loop through all list items, and hide those who don't match the search query
  for (i = 0; i < li.length; i++) {
    button = li[i].getElementsByTagName("button")[0];
    if (button.innerHTML.toUpperCase().indexOf(filter) > -1) {
      li[i].style.display = "";
    } else {
      li[i].style.display = "none";
    }
  }
}
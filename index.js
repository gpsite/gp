function search() {
  // Declare variables
  var input, filter, ul, li, button, i, a, txtValue;
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

  // Loop through all dropdown items to filter them as well
  var dropdowns = document.getElementsByClassName("dropdown-content");
  for (i = 0; i < dropdowns.length; i++) {
    a = dropdowns[i].getElementsByTagName("a");
    for (var j = 0; j < a.length; j++) {
      txtValue = a[j].textContent || a[j].innerText;
      if (txtValue.toUpperCase().indexOf(filter) > -1) {
        a[j].style.display = "";
      } else {
        a[j].style.display = "none";
      }
    }
  }
}

function toggleDropdown(id) {
  var element = document.getElementById(id);
  if (element.classList.contains("active")) {
    element.classList.remove("active");
    element.style.display = "none";
  } else {
    element.classList.add("active");
    element.style.display = "block";
  }
}
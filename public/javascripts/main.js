$(function(){
    if($('textarea#ta').length){
        CKEDITOR.replace('ta');
    }

    $('a.confirmDeletion').on('click',function(){
        if(!confirm('Confirm deletion'))
            return false;
    });
});
if ($("[data-fancybox]").length) {
   $("[data-fancybox]").fancybox();
}
$(document).ready(function () {
  $('#dtVerticalScrollExample').DataTable({
    "scrollY": "200px",
    "scrollCollapse": true,
  });
  $('.dataTables_length').addClass('bs-select');
});
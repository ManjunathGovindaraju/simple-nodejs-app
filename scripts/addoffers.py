import requests

url = "http://dilip-service.cfapps.io/offers"
headers = {
    'content-type': "application/json"
    }


from openpyxl import load_workbook
wb2 = load_workbook('offers.xlsx')
worksheet = wb2.active

first_row = list(worksheet.rows)[0]
RR = 1
print headers
for row in worksheet.rows:
    if RR == 1:
        #Skip first row because its just heading
        RR = RR+1
    else:
        latitute = row[0].value
        logitude = row[1].value
        company =  row[2].value
        address =  row[3].value
        short_offer =  row[4].value
        long_offer =  row[5].value
        validity =  row[6].value
        poster =  row[7].value
        category =  row[8].value
        #radius = row[9].value
        isuploaded = row[10].value
        payload = \
            "{\r\n\"latitute\" : " + str(latitute) + \
            ",\r\n\"longitude\" :" + str(logitude) + \
            ",\r\n\"company\": \"" +company + \
            "\",\r\n\"address\" : \""+address + \
            "\",\r\n\"short_offer\": \""+short_offer + \
            "\",\r\n\"long_offer\": \""+long_offer + \
            "\",\r\n\"validity\": \""+validity + \
            "\",\r\n\"poster\": \""+poster + \
            "\",\r\n\"category\": \""+category + \
            "\"\r\n}"

        if isuploaded == "no":
            #print payload
            response = requests.request("POST", url, data=payload, headers=headers)
            print(response.text)
        else:
            print "Skipping the already uploaded entries"
        #for col in row:
        #    print col.value
